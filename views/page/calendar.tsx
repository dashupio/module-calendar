
import Moment from 'moment'
import { extendMoment } from 'moment-range';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import * as BigCalendar from 'react-big-calendar';
import React, { useRef, useState, useEffect } from 'react';
import { Box, Page, Item, Menu, MenuItem, Tooltip, Button, IconButton, Icon } from '@dashup/ui';

// calendar
const Calendar = withDragAndDrop(BigCalendar.Calendar);

// extend
const moment = extendMoment(Moment);

// calendar
import './calendar.scss';

// to the correct localizer.
const localizer = BigCalendar.momentLocalizer(moment);

// calendar page
const CalendarPage = (props = {}) => {
  // views
  const views = {
    'day'       : 'Day',
    'week'      : 'Week',
    'month'     : 'Month',
    'agenda'    : 'Agenda',
    'work_week' : 'Work Week',
  };

  // menu ref
  const menuRef = useRef(null);

  // required
  const required = [{
    key   : 'data.models.0.model',
    label : 'Model',
  }, {
    key   : 'data.models.0.form',
    label : 'Form',
  }, {
    key   : 'data.models.0.date',
    label : 'Date Field',
  }];

  // selected view
  const selectedView = props.page.get('user.view') || props.page.get('data.view') || 'month';

  // state
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(views[selectedView] ? selectedView : 'month');
  const [sets, setSets] = useState([]);
  const [share, setShare] = useState(false);
  const [config, setConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  const [modalModel, setModalModel] = useState(null);

  // get forms
  const getForms = () => {
    // reduce forms
    return (props.page.get('data.models') || []).reduce((accum, mod) => {
      // get forms
      if (!accum.includes(mod.form)) accum.push(mod.form);

      // return accum
      return accum;
    }, []).map((id) => {
      // get form
      return id && props.dashup.page(id);
    }).filter((f) => f);
  };

  // get query
  const getQuery = ({ model, form, date : field, filter, tag, user }) => {
    // check form/model
    if (!form || !model || !field) return null;

    // get model
    const modelPage = model && props.dashup.page(model);

    // check page
    if (!modelPage) return null;

    // get form
    const forms = props.getForms([modelPage]);
    const fields = props.getFields(forms);
    const dateField = props.getField(field, fields);

    // get query
    let query = props.getQuery(modelPage, forms, { tag, user, filter });

    // date field
    if (!dateField) return null;

    // start end date
    let endDate   = null;
    let startDate = null;

    // calendar
    if (['month', 'agenda'].includes(view)) {
      // week
      endDate = moment(date).endOf('month').toDate();
      startDate = moment(date).startOf('month').toDate();
    } else if (['week', 'work_week'].includes(view)) {
      // week
      endDate = moment(date).endOf('week').toDate();
      startDate = moment(date).startOf('week').toDate();
    } else if (view === 'day') {
      // units
      endDate = moment(date).endOf('day').toDate();
      startDate = moment(date).startOf('day').toDate();
    }

    // add where
    query = query.or({
      // range included in date
      [`${dateField.name || dateField.uuid}.end`] : {
        $ne : null,
        $gt : startDate,
      },
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
      },
    }, {
      // single date included in date
      [`${dateField.name || dateField.uuid}.end`]   : null,
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
        $gt : startDate,
      },
    }, {
      // repeated forever
      [`${dateField.name || dateField.uuid}.repeat.ends`] : 'forever',
      [`${dateField.name || dateField.uuid}.start`]    : {
        $lt : endDate,
      },
    }, {
      // repeated until
      [`${dateField.name || dateField.uuid}.repeat.until`] : {
        $ne : null,
        $gt : startDate,
      },
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
      },
    });

    // return query
    return query;
  };

  // get items
  const getItems = () => {
    // items
    return sets.reduce((accum, set, i) => {
      // get model
      const model = props.page.get(`data.models.${i}`);

      // check model
      if (!model) return accum;

      // get items
      const forms = props.getForms([model.model]);
      const fields = props.getFields(forms);
      const dateField = props.getField(model.date, fields);

      // check field
      if (!dateField) return accum;

      // start end date
      let endDate   = null;
      let startDate = null;
  
      // calendar
      if (['month', 'agenda'].includes(view)) {
        // week
        endDate = moment(date).endOf('month').toDate();
        startDate = moment(date).startOf('month').toDate();
      } else if (['week', 'work_week'].includes(view)) {
        // week
        endDate = moment(date).endOf('week').toDate();
        startDate = moment(date).startOf('week').toDate();
      } else if (view === 'day') {
        // units
        endDate = moment(date).endOf('day').toDate();
        startDate = moment(date).startOf('day').toDate();
      }

      // create range
      const range = moment.range(startDate, endDate);

      // push items
      accum.push(...set.reduce((subAccum, item) => {
        // get start
        const start = new Date(item.get(`${dateField.name || dateField.uuid}.start`));
        const end   = item.get(`${dateField.name || dateField.uuid}.end`) ?
          new Date(item.get(`${dateField.name || dateField.uuid}.end`)) :
          moment(start).add(30, 'minutes').toDate();

        // get repeat
        if (item.get(`${dateField.name || dateField.uuid}.repeat`)) {
          // loop repeat
          let next = moment(start);

          // chech while
          while (next.toDate() < endDate) {
            // get end
            const nextEnd = new Date(next.toDate().getTime() + item.get(`${dateField.name || dateField.uuid}.duration`));
            const subRange = moment.range(next.toDate(), nextEnd);

            // check ends within or starts within
            if (range.overlaps(subRange)) {
              // return accum
              accum.push({
                item,
                model,
                id      : `${item.get('_id')}-${subRange.end.format('LL')}`,
                end     : subRange.end.toDate(),
                field   : dateField,
                start   : subRange.start.toDate(),
                allDay  : dateField.date === 'date',
                repeat  : item.get(`${dateField.name || dateField.uuid}.repeat`),
                display : model.display,
              });
            }

            // add
            next.add(item.get(`${dateField.name || dateField.uuid}.repeat.amount`) || 1, item.get(`${dateField.name || dateField.uuid}.repeat.period`) || 'day');
          }
        } else {
          // return item
          subAccum.push({
            id      : item.get('_id'),
            field   : dateField,
            allDay  : dateField.date === 'date',
            display : model.display,
            end,
            item,
            start,
            model,
          });
        }

        // return sub accum
        return subAccum;
      }, []));

      // return accum
      return accum;
    }, []);
  };

  // get tags
  const getTags = () => {
    // return logic
    return (props.page.get('data.models') || []).reduce((accum, mod) => {
      // tags
      if (mod.tag) accum.push(...mod.tag);

      // accum
      return accum;
    }, []);
  };

  // get tags
  const getUsers = () => {
    // return logic
    return (props.page.get('data.models') || []).reduce((accum, mod) => {
      // tags
      if (mod.user) accum.push(...mod.user);

      // accum
      return accum;
    }, []);
  };

  // get fields
  const getFields = () => {
    // return logic
    const fields = (props.page.get('data.models') || []).reduce((accum, mod) => {
      // tags
      if (mod.form) accum.push(...props.getFields([mod.form]));

      // accum
      return accum;
    }, []);

    return fields;
  };

  // on prev
  const onPrev = (e) => {
    // prevent
    e.preventDefault();
    e.stopPropagation();
    
    // check date
    if (['month', 'agenda'].includes(view)) {
      // add one month
      return setDate(moment(date).subtract(1, 'month').toDate());
    }
    if (['week', 'work_week'].includes(view)) {
      // add one month
      return setDate(moment(date).subtract(1, 'week').toDate());
    }
    if (view === 'day') {
      // add one month
      return setDate(moment(date).subtract(1, 'day').toDate());
    }
  };

  // on next
  const onNext = (e) => {
    // prevent
    e.preventDefault();
    e.stopPropagation();
    
    // check date
    if (['month', 'agenda'].includes(view)) {
      // add one month
      return setDate(moment(date).add(1, 'month').toDate());
    }
    if (['week', 'work_week'].includes(view)) {
      // add one month
      return setDate(moment(date).add(1, 'week').toDate());
    }
    if (view === 'day') {
      // add one month
      setDate(moment(date).add(1, 'day').toDate());
    }
  };

  // is today
  const isToday = () => {
    // check day
    return moment().format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD');
  };

  // set tag
  const setTag = async (field, value) => {
    // set tag
    let tags = (props.page.get('user.filter.tags') || []).filter((t) => typeof t === 'object');

    // check tag
    if (tags.find((t) => t.field === field.uuid && t.value === (value?.value || value))) {
      // exists
      tags = tags.filter((t) => t.field !== field.uuid || t.value !== (value?.value || value));
    } else {
      // push tag
      tags.push({
        field : field.uuid,
        value : (value?.value || value),
      });
    }

    // set data
    await props.setUser('filter.tags', tags);
  };

  // set search
  const setSearch = (search = '') => {
    // set page data
    props.page.set('user.search', search.length ? search : null);
  };

  // use effect
  useEffect(() => {
    // find data
    const queries = (props.page.get('data.models') || []).map((mod) => getQuery(mod));

    // on update
    const onUpdate = () => {
      setUpdated(new Date());
    };

    // set data
    let data = null;

    // find
    Promise.all(queries.map(async (query) => {
      // return query
      const loaded = query?.listen ? await query.listen() : [];

      // on updated
      if (loaded?.on) loaded.on('update', onUpdate);

      // loaded
      return loaded; 
    })).then((sets) => setSets(sets.filter((s) => s)));

    // add listener
    props.page.on('user.search', onUpdate);
    props.page.on('data.models', onUpdate);
    props.page.on('user.filter.me', onUpdate);
    props.page.on('user.filter.tags', onUpdate);

    // return fn
    return () => {
      // remove listener
      props.page.removeListener('user.search', onUpdate);
      props.page.removeListener('data.models', onUpdate);
      props.page.removeListener('user.filter.me', onUpdate);
      props.page.removeListener('user.filter.tags', onUpdate);

      // check data
      if (data && data.removeListener) {
        data.deafen();
        data.removeListener('update', onUpdate);
      }
    };
  }, [
    date,
    props.page.get('type'),
    props.page.get('user.search'),
    props.page.get('user.filter.me'),
    props.page.get('user.filter.tags'),
    JSON.stringify(props.page.get('data.models') || []),
  ]);

  // return jsx
  return (
    <Page { ...props } loading={ loading } require={ required } bodyClass="flex-column">

      { !!modalModel && !!props.item && (
        <Page.Item
          show
          tag={ modalModel.tag }
          item={ props.item }
          form={ modalModel.form }
          user={ modalModel.user }
          onHide={ (e) => props.setItem(null) }
          setItem={ props.setItem }
          getForms={ () => [modalModel.form].map((f) => f && props.dashup.page(f)).filter((f) => f) }
          getField={ (id) => {
            // return
            if (!modalModel.form) return;

            // get model
            const fields = props.getFields([modalModel.form]);

            // get field
            return props.getField(id, fields);
          } }
        />
      ) }
      <Page.Share show={ share } onHide={ (e) => setShare(false) } />
      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu onConfig={ () => setConfig(true) } presence={ props.presence } onShare={ () => setShare(true) }>

        <Button ref={ menuRef } variant="contained" onClick={ () => setOpen(true) }>
          View:
          { ' ' }
          <b>{ views[view] }</b>
        </Button>
        <Menu
          open={ open }
          onClose={ () => setOpen(false) }
          anchorEl={ menuRef?.current }
        >
          { Object.keys(views).map((key, i) => {
            // return jsx
            return (
              <MenuItem key={ `view-${key}` } onClick={ (e) => !setView(key) && props.setUser('view', key) }>
                { views[key] }
              </MenuItem>
            );
          }) }
        </Menu>

        <Button color="primary" variant="contained" disabled={ !!isToday() } onClick={ (e) => setDate(new Date()) }>
          { isToday() ? 'Today' : moment(date).format('LL') }
        </Button>

        <IconButton onClick={ (e) => onPrev(e) }>
          <Icon type="fas" icon="chevron-left" />
        </IconButton>
        <IconButton onClick={ (e) => onNext(e) }>
          <Icon type="fas" icon="chevron-right" />
        </IconButton>

        { props.dashup.can(props.page, 'submit') && !!getForms().length && (
          <Button variant="contained" color="primary" startIcon={ (
            <Icon type="fas" icon={ getForms()[0].get('icon') || 'plus' } />
          ) } onClick={ (e) => {
            // get form
            const form = getForms()[0];
            
            // set model/form
            form && setModalModel(props.page.get('data.models').find((m) => m.form === form.get('_id')));

            // set item
            props.setItem(new props.dashup.Model({}, props.dashup));
          } }>
            { getForms()[0].get('name') }
          </Button>
        ) }
        
      </Page.Menu>
      <Page.Filter onSearch={ setSearch } getFields={ getFields } onTag={ setTag } tags={ getTags() } users={ getUsers() } />
      <Page.Body>
        <Box position="relative" flex={ 1 }>
          <Box position="absolute" top={ 0 } left={ 0 } right={ 0 } bottom={ 0 }>
            <Calendar
              view={ view }
              onView={ () => {} }
              views={ Object.keys(views) }

              date={ date }
              onNavigate={ () => {} }
              onEventDrop={ ({ start, end, event }) => {
                // set item
                event.item.set(`${event.field.name || event.field.uuid}.end`, end);
                event.item.set(`${event.field.name || event.field.uuid}.start`, start);
                event.item.save();
                setUpdated(new Date());
              } }
              onEventResize={ ({ start, end, event }) => {
                // set item
                event.item.set(`${event.field.name || event.field.uuid}.end`, end);
                event.item.set(`${event.field.name || event.field.uuid}.start`, start);
                event.item.save();
                setUpdated(new Date());
              } }

              components={ {
                event : ({ event }) => {
                  // repeat
                  const hsl = event.model?.color?.hsl;
                  const repeat = event.repeat;

                  // return event
                  return (
                    <Tooltip title={ (
                      event.allDay ? (
                        moment(event.start).format('MMM DD YYYY')
                      ) : (
                        `${moment(event.start).format('hh:mm a')} - ${moment(event.end).format('hh:mm a')}`
                      )
                    ) } key={ `schedule-item-${event.item.get('_id')}` }>
                      <Item
                        sx={ {
                          width  : '100%',
                          height : '100%',
                        } }
                        tag={ event?.model?.tag }
                        user={ event?.model?.user }
                        size="sm"
                        item={ event.item }
                        page={ props.page }
                        group={ 'calendar' }
                        dashup={ props.dashup }
                        onClick={ () => {
                          setModalModel(event?.model);
                          props.setItem(event.item);
                        } }
                        template={ event.display }
                        getField={ (id) => {
                          // return
                          if (!event?.model?.model) return;

                          // get model
                          const forms = props.getForms([event.model.model]);
                          const fields = props.getFields(forms);

                          // get field
                          return props.getField(id, fields);
                        } }
                        background={ hsl ? `hsla(${hsl.h},${(hsl.s * 100)}%,${(hsl.l * 100)}%,0.1)` : null }
                        repeat={ !!repeat && (
                          <>
                            Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                            { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                          </>
                        ) }
                      />
                    </Tooltip>
                  );
                },
              } }

              events={ getItems() }
              localizer={ localizer }
              endAccessor="end"
              startAccessor="start"
            />
          </Box>
        </Box>
      </Page.Body>
    </Page>
  );
};

// export default
export default CalendarPage;