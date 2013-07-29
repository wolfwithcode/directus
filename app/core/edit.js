define([
  "app",
  "backbone"
],

function(app, Backbone) {

  var EditView = Backbone.Layout.extend({

    tagName: "form",

    hiddenFields: [
      'id',
      'active',
      'sort'
    ],

    beforeRender: function() {
      var UI = ui.initialize({model: this.model, structure: this.structure});

      this.structure.each(function(column) {

        // Skip ID
        if('id' == column.id) {
          return;
        }

        var view = UI.getInput(column.id);

        // Display:none; hidden fields
        if (_.contains(this.hiddenFields, column.id)) {
          // return;
          // console.log('hidden view',view);
          view.$el.css({'display':'none'});
        }

        //@todo: move this to UI
        view.$el.attr('id', 'edit_field_'+column.id);
        this.insertView(view);

      }, this);
    },

    constructor: function (options) {
      Backbone.Layout.__super__.constructor.call(this, options);
      this.$el.addClass('directus-form');
      this.$el.attr('id','directus-form');
    },

    //Focus on first input
    afterRender: function() {
      var $first = this.$el.find(':input:first:visible');
      $first.focus();
      $first.val($first.val());

      if(this.options.collectionAdd && !_.isEmpty(this.options.parentField)) {
        this.model.set(this.options.parentField.name, this.options.parentField.value);
        var $select = this.$el.find('[name=' + this.options.parentField.name + ']');
        $select.closest('fieldset').hide();
      }
    },

    data: function() {
      var data = this.$el.serializeObject();
      var whiteListedData = _.pick(data, this.visibleFields);
      return whiteListedData;
    },

    initialize: function(options) {
      var structureHiddenFields,
          optionsHiddenFields = options.hiddenFields || [];

      this.structure = this.model.getStructure();

      // Hide fields defined as hidden in the schema
      structureHiddenFields = this.structure.chain()
        .filter(function(column) { return column.get('hidden_input'); })
        .pluck('id')
        .value();

      this.hiddenFields = _.union(optionsHiddenFields, structureHiddenFields, this.hiddenFields);
      this.visibleFields = _.difference(this.structure.pluck('id'), this.hiddenFields);

      // @todo rewrite this!
      this.model.on('invalid', function(model, errors) {
        //Get rid of all errors
        this.$el.find('.error').remove();
        _.each(errors, function(item) {
          $fieldset = $('#edit_field_' + item.attr);
          if ($fieldset.find('.error').length < 1) {
            $fieldset.append('<span class="error">'+item.message+'</span>');
          }
        });
      }, this);

      this.model.on('sync', function(e) {
        // reset changes!
        this.model.changed = {};
        this.render();
      }, this);

    }

  });

  return EditView;
});