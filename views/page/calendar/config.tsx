
// import react
import React from 'react';
import shortid from 'shortid';
import { Dropdown } from 'react-bootstrap';
import { View, Query, Select } from '@dashup/ui';

// calendar page config
const PageCalendarConfig = (props = {}) => {
  // colors
  const colors = ['white', 'primary', 'secondary', 'success', 'info', 'warning', 'danger'];

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

    // props
    props.setData('models', [...(props.page.get('data.models') || [])], prev);
  };

  // return jsx
  return (
    <>
      { (props.page.get('data.models') || []).map((model, i) => {
        // return jsx
        return (
          <div key={ `model-${model.uuid}` } className="card mb-3">
            <div className="card-header d-flex align-items-center">
              <b>
                { `Model #${i}` }
              </b>
              <button className="ms-auto btn btn-danger" onClick={ (e) => onRemove(i) }>
                <i className="fa fa-times" />
              </button>
            </div>
            <div className="card-body">

              <div className="mb-3">
                <div className="d-flex flex-row">
                  <div className="flex-0 me-3">
                    <div className="mb-3">
                      <label className="d-block form-label">
                        Color
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle variant={ model.color || 'white' } className="btn-picker">
                          &nbsp;
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="p-3">
                          { colors.map((color, i) => {
                            // return jsx
                            return (
                              <button key={ `color-${color}` } className={ `btn-picker bg-${color} me-2` } onClick={ (e) => setModel(model, 'color', color) } />
                            );
                          }) }
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="form-label">
                      Calendar Model
                    </label>
                    <Select options={ getModel(model) } defaultValue={ getModel(model).filter((f) => f.selected) } onChange={ (val) => setModel(model, 'model', val?.value) } isClearable />
                  </div>
                </div>
              </div>
              
              { !!model.model && (
                <div className="mb-3">
                  <label className="form-label">
                    Calendar Form
                  </label>
                  <Select options={ getForm(model) } defaultValue={ getForm(model).filter((f) => f.selected) } onChange={ (val) => setModel(model, 'form', val?.value) } isClearable />
                </div>
              ) }

              { !!model.form && (
                <>
                  <hr />
                  
                  <div className="mb-3">
                    <label className="form-label">
                      Date Field
                    </label>
                    <Select options={ getField(model, 'date', ['date']) } defaultValue={ getField(model, 'date', ['date']).filter((f) => f.selected) } onChange={ (val) => setModel(model, 'date', val?.value) } isClearable />
                  </div>
                    
                  <div className="mb-3">
                    <label className="form-label">
                      Tag Field(s)
                    </label>
                    <Select options={ getField(model, 'tag', ['select', 'checkbox']) } defaultValue={ getField(model, 'tag', ['select', 'checkbox']).filter((f) => f.selected) } onChange={ (val) => setModel(model, 'tag', val.map((v) => v?.value)) } isClearable isMulti />
                    <small>
                      Selecting a tag field will allow you to tag tasks.
                    </small>
                  </div>
                    
                  <div className="mb-3">
                    <label className="form-label">
                      User Field(s)
                    </label>
                    <Select options={ getField(model, 'user', ['user']) } defaultValue={ getField(model, 'user', ['user']).filter((f) => f.selected) } onChange={ (val) => setModel(model, 'user', val.map((v) => v?.value)) } isClearable isMulti />
                    <small>
                      Selecting a user field will allow you to assign tasks to that user.
                    </small>
                  </div>
  
                  <div className="mb-3">
                    <label className="form-label">
                      Item Title
                    </label>
                    <View
                      type="field"
                      view="code"
                      mode="handlebars"
                      struct="code"
                      value={ model.display }
                      dashup={ props.dashup }
                      onChange={ (val) => setModel(model, 'display', val) }
                      />
                  </div>
                    
                  <div className="mb-3">
                    <label className="form-label">
                      Filter By
                    </label>
                    <Query
                      isString

                      page={ props.page }
                      query={ model.filter }
                      dashup={ props.dashup }
                      fields={ props.getFields([model.form]) }
                      onChange={ (val) => setModel(model, 'filter', val) }
                      getFieldStruct={ props.getFieldStruct }
                      />
                  </div>
                </>
              ) }
            </div>
          </div>
        );
      }) }
      <div className="text-end">
        <button className="btn btn-success" onClick={ (e) => onCreate(e) }>
          Add Model
        </button>
      </div>
    </>
  );
};

// export default
export default PageCalendarConfig;