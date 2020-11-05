
// import page interface
import { Struct } from '@dashup/module';

/**
 * build address helper
 */
export default class CalendarPage extends Struct {

  /**
   * returns page type
   */
  get type() {
    // return page type label
    return 'calendar';
  }

  /**
   * returns page type
   */
  get icon() {
    // return page type label
    return 'fa fa-calendar-week';
  }

  /**
   * returns page type
   */
  get title() {
    // return page type label
    return 'Calendar Page';
  }

  /**
   * returns page data
   */
  get data() {
    // return page data
    return {};
  }

  /**
   * returns object of views
   */
  get views() {
    // return object of views
    return {
      view   : 'page/calendar/view',
      menu   : 'page/calendar/menu',
      filter : 'page/calendar/filter',
      config : 'page/calendar/config',
    };
  }

  /**
   * returns category list for page
   */
  get categories() {
    // return array of categories
    return ['View'];
  }

  /**
   * returns page descripton for list
   */
  get description() {
    // return description string
    return 'Calendar view page';
  }
}