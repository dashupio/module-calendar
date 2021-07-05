
import Moment from 'moment'
import { Page, Card } from '@dashup/ui';
import { extendMoment } from 'moment-range';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import * as BigCalendar from 'react-big-calendar';
import React, { useState, useEffect } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

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

  // required
  const required = [{
    key   : 'data.models.0.model',
    label : 'Model',
  }, {
    key   : 'data.models.0.form',
    label : 'Form',
  }];

  // state
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(props.page.get('data.view') && views[props.page.get('data.view')] ? props.page.get('data.view') : 'month');
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
    const modelPage = props.dashup.page(model);

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

      { !!modalModel && !!props.item && <Page.Item
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
      }
      <Page.Share show={ share } onHide={ (e) => setShare(false) } />
      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu onConfig={ () => setConfig(true) } presence={ props.presence } onShare={ () => setShare(true) }>
        <Dropdown>
          <Dropdown.Toggle variant="light" id="dropdown-limit" className="me-2">
            View:
            <b className="ms-1">{ views[props.page.get('data.view') || 'month'] }</b>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            { Object.keys(views).map((key, i) => {
              // return jsx
              return (
                <Dropdown.Item key={ `view-${key}` } onClick={ (e) => !setView(key) && props.setData('view', key) }>
                  { views[key] }
                </Dropdown.Item>
              );
            }) }
          </Dropdown.Menu>
        </Dropdown>

        <button className={ `btn me-1 btn-primary${isToday() ? ' disabled' : ''}` } onClick={ (e) => setDate(new Date()) }>
          { isToday() ? 'Today' : moment(date).format('LL') }
        </button>
        <div className="btn-group me-2">
          <button className="btn btn-primary" onClick={ (e) => onPrev(e) } data-toggle="tooltip" title="Previous">
            <i className="fa fa-chevron-left" />
          </button>
          <button className="btn btn-primary" onClick={ (e) => onNext(e) } data-toggle="tooltip" title="Next">
            <i className="fa fa-chevron-right" />
          </button>
        </div>

        { props.dashup.can(props.page, 'submit') && !!getForms().length && (
          getForms().length > 1 ? (
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-create" className="me-2">
                <i className="fat fa-plus me-2" />
                Create
              </Dropdown.Toggle>

              <Dropdown.Menu>
                { getForms().map((form, i) => {
                  // return jsx
                  return (
                    <Dropdown.Item key={ `create-${form.get('_id')}` } onClick={ (e) => {
                      // set model/form
                      setModalModel(props.page.get('data.models').find((m) => m.form === form.get('_id')));

                      // set item
                      props.setItem(new props.dashup.Model({}, props.dashup));
                    } }>
                      <i className={ `me-2 fa-${form.get('icon') || 'pencil fas'}` } />
                      { form.get('name') }
                    </Dropdown.Item>
                  );
                }) }
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <button className="btn btn-primary me-2" onClick={ (e) => {
              // get form
              const form = getForms()[0];
              
              // set model/form
              setModalModel(props.page.get('data.models').find((m) => m.form === form.get('_id')));

              // set item
              props.setItem(new props.dashup.Model({}, props.dashup));
            } }>
              <i className={ `me-2 fa-${getForms()[0].get('icon') || 'pencil fas'}` } />
              { getForms()[0].get('name') }
            </button>
          )
        ) }
        
      </Page.Menu>
      <Page.Filter onSearch={ setSearch } getFields={ getFields } onTag={ setTag } tags={ getTags() } users={ getUsers() } />
      <Page.Body>
        <div className="d-flex flex-1 fit-content">
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
              event : (subProps = {}) => {
                // repeat
                const repeat = subProps.event.repeat;

                // return event
                return (
                  <OverlayTrigger
                    overlay={
                      <Tooltip>
                        { subProps.event.allDay ? (
                          moment(subProps.event.start).format('MMM DD YYYY')
                        ) : (
                          `${moment(subProps.event.start).format('hh:mm a')} - ${moment(subProps.event.end).format('hh:mm a')}`
                        ) }
                      </Tooltip>
                    }
                    placement="top"
                  >
                    <div className="h-100 w-100">
                      <Card
                        key={ `schedule-item-${subProps.event.item.get('_id')}` }
                        tag={ subProps.event?.model?.tag }
                        user={ subProps.event?.model?.user }
                        size="sm"
                        item={ subProps.event.item }
                        page={ props.page }
                        group={ 'calendar' }
                        dashup={ props.dashup }
                        onClick={ () => {
                          setModalModel(subProps.event?.model);
                          props.setItem(subProps.event.item);
                        } }
                        template={ subProps.event.display }
                        getField={ (id) => {
                          // return
                          if (!subProps.event?.model?.model) return;

                          // get model
                          const forms = props.getForms([subProps.event.model.model]);
                          const fields = props.getFields(forms);

                          // get field
                          return props.getField(id, fields);
                        } }
                        background={ `bg-${subProps.event?.model?.color || ''}-transparent` }
                        repeat={ !!repeat && (
                          <Tooltip>
                            Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                            { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                          </Tooltip>
                        ) }
                      />
                    </div>
                  </OverlayTrigger>
                );
              },
            } }

            events={ getItems() }
            localizer={ localizer }
            endAccessor="end"
            startAccessor="start"
          />
        </div>
      </Page.Body>
    </Page>
  );
};

// export default
export default CalendarPage;