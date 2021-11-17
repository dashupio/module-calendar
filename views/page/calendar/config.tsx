
// import react
import shortid from 'shortid';
import React, { useState } from 'react';
import { Box, useTheme, View, Color, colors, Query, TextField, MenuItem, Card, CardContent, CardHeader, Divider, IconButton, Icon, Stack, Button } from '@dashup/ui';

// timeout
let timeout;

// debounce
const debounce = (fn, to = 200) => {
  clearTimeout(timeout);
  timeout = setTimeout(fn, to);
};

// calendar page config
const PageCalendarConfig = (props = {}) => {
  // theme
  const theme = useTheme();

  // state
  const [color, setColor] = useState(null);
  const [model, setAModel] = useState(null);
  const [updated, setUpdated] = useState(new Date());

  // views
  const views = {
    'day'       : 'Day',
    'week'      : 'Week',
    'month'     : 'Month',
    'agenda'    : 'Agenda',
    'work_week' : 'Work Week',
  };

  /**
   * get view
   */
  const getView = () => {
    // views
    return Object.keys(views).map((type) => {
      // return object
      return {
        value : type,
        label : views[type],

        selected : props.page.get('data.view') === type,
      };
    });
  };

  // get dashboards
  const getModel = (model) => {
    // get forms
    const models = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'model' && !page.get('archived');
    });

    // return mapped
    return models.map((m) => {
      // return values
      return {
        value : m.get('_id'),
        label : m.get('name'),

        selected : (model.model || []).includes(m.get('_id')),
      };
    });
  };

  // get forms
  const getForm = (model) => {
    // get forms
    const forms = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'form' && page.get('data.model') === model.model && !page.get('archived');
    });

    // return mapped
    return forms.map((form) => {
      // return values
      return {
        value : form.get('_id'),
        label : form.get('name'),

        selected : (model.form || []).includes(form.get('_id')),
      };
    });
  };

  // get field
  const getField = (model, name, types = []) => {
    // get forms
    const forms = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'form' && page.get('data.model') === model.model && !page.get('archived');
    });

    // get field
    return props.getFields(forms, types).map((field) => {
      // return values
      return {
        value : field.uuid,
        label : field.label || field.name,

        selected : (model[name] || []).includes(field.uuid),
      };
    });
  };

  // on remove
  const onRemove = (i) => {
    // get models
    const newModels = props.page.get('data.models');

    // remove
    newModels.splice(i, 1);

    // set data
    props.setData('models', [...newModels]);
  };

  // on create
  const onCreate = () => {
    // get models
    props.setData('models', [...(props.page.get('data.models') || []), {
      uuid : shortid(),
    }]);
  };

  // set model
  const setModel = (model, key, value, prev = false) => {
    // set value
    model[key] = value;

    // set updated
    setUpdated(new Date());

    // props
    debounce(() => props.setData('models', [...(props.page.get('data.models') || [])], prev));
  };

  // return jsx
  return (
    <>
      <TextField
        label="Default View"
        value={ props.page.get('data.view') }
        select
        onChange={ (e) => props.setData('view', e.target.value) }
        fullWidth
      >
        { getView().map((option) => (
          <MenuItem key={ option.value } value={ option.value }>
            { option.label }
          </MenuItem>
        ))}
      </TextField>

      <Box my={ 2 }>
        <Divider />
      </Box>
      
      { (props.page.get('data.models') || []).map((model, i) => {
        // return jsx
        return (
          <Card key={ `model-${model.uuid}` } sx={ {
            mb : 2,
          } } variant="outlined">
            <CardHeader
              title={ model.name || `Model #${i}` }
              action={ (
                <>
                  <IconButton onClick={ (e) => setModel(model, 'open', !model.open) }>
                    <Icon type="fas" icon={ model.open ? 'times' : 'pencil' } />
                  </IconButton>
                  <IconButton onClick={ (e) => onRemove(i) } color="error">
                    <Icon type="fas" icon="trash" />
                  </IconButton>
                </>
              ) }
            />
            { !!model.open && (
              <CardContent>
                <Stack direction="row" spacing={ 2 } sx={ {
                  mb : 2,
                } }>
                  <Button variant="contained" onClick={ (e) => !setAModel(model) && setColor(e.target) } sx={ {
                    color           : model.color?.hex && theme.palette.getContrastText(model.color?.hex),
                    backgroundColor : model.color?.hex,
                  } }>
                    <Icon type="fas" icon="tint" fixedWidth />
                  </Button>
                  <TextField
                    label="Name"
                    onChange={ (e) => setModel(model, 'name', e.target.value) }
                    defaultValue={ model.name }
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Calendar Model"
                  value={ model.model }
                  select
                  onChange={ (e) => setModel(model, 'model', e.target.value) }
                  fullWidth
                >
                  { getModel(model).map((option) => (
                    <MenuItem key={ option.value } value={ option.value }>
                      { option.label }
                    </MenuItem>
                  )) }
                </TextField>
                <TextField
                  label="Calendar Form"
                  value={ model.form }
                  select
                  onChange={ (e) => setModel(model, 'form', e.target.value) }
                  fullWidth
                >
                  { getForm(model).map((option) => (
                    <MenuItem key={ option.value } value={ option.value }>
                      { option.label }
                    </MenuItem>
                  )) }
                </TextField>
                { !!model.form && (
                  <>
                    <TextField
                      label="Date Field"
                      value={ model.date }
                      select
                      onChange={ (e) => setModel(model, 'date', e.target.value) }
                      fullWidth
                    >
                      { getField(model, 'date', ['date']).map((option) => (
                        <MenuItem key={ option.value } value={ option.value }>
                          { option.label }
                        </MenuItem>
                      )) }
                    </TextField>

                    <TextField
                      label="Tag Field(s)"
                      value={ Array.isArray(model.tag) ? model.tag : [model.tag].filter((t) => t) }
                      select
                      onChange={ (e) => setModel(model, 'tag', e.target.value) }
                      fullWidth
                      helperText="Selecting a tag field will allow you to tag tasks."

                      SelectProps={ {
                        multiple : true,
                      } }
                    >
                      { getField(model, 'tag', ['select', 'checkbox']).map((option) => (
                        <MenuItem key={ option.value } value={ option.value }>
                          { option.label }
                        </MenuItem>
                      )) }
                    </TextField>

                    <TextField
                      label="User Field(s)"
                      value={ Array.isArray(model.user) ? model.user : [model.user].filter((u) => u) }
                      select
                      onChange={ (e) => setModel(model, 'user', e.target.value) }
                      fullWidth
                      helperText="Selecting a user field will allow you to assign tasks to that user."

                      SelectProps={ {
                        multiple : true,
                      } }
                    >
                      { getField(model, 'user', ['user']).map((option) => (
                        <MenuItem key={ option.value } value={ option.value }>
                          { option.label }
                        </MenuItem>
                      )) }
                    </TextField>

                    <View
                      type="field"
                      view="input"
                      mode="handlebars"
                      struct="code"
                      field={ {
                        label : 'Item Title',
                      } }
                      value={ model.display }
                      dashup={ props.dashup }
                      onChange={ (field, val) => debounce(() => setModel(model, 'display', val) ) }
                    />

                    <Box my={ 2 }>
                      <Divider />
                    </Box>

                    <Query
                      isString

                      page={ props.page }
                      label="Filter By"
                      query={ model.filter }
                      dashup={ props.dashup }
                      fields={ props.getFields([model.form]) }
                      onChange={ (val) => setModel(model, 'filter', val) }
                      getFieldStruct={ props.getFieldStruct }
                    />
                  </>
                ) }
              </CardContent>
            ) }
          </Card>
        );
      }) }
      <Box display="flex" justifyContent="flex-end">
        <Button color="success" variant="contained" onClick={ (e) => onCreate() }>
          Add Model
        </Button>
      </Box>

      { !!color && !!model && <Color show target={ color } color={ model.color?.hex } colors={ Object.values(colors) } onChange={ (c) => setModel(model, 'color', c) } onClose={ () => !setColor(null) && setAModel(null) } /> }
    </>
  );
};

// export default
export default PageCalendarConfig;