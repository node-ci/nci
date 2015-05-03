define(['react'], function(React) {return (function (React) {
  var fn = function(locals) {
    var tags = [];
    var locals_for_with = locals || {};
    (function(Item, console, items) {
      tags.push(React.createElement.apply(React, [ "div", {} ].concat(function() {
        var tags = [];
        tags.push(React.createElement("h2", {}, "projects list"));
        console.log(this);
        tags.push(function() {
          var tags = [];
          var $$obj = items;
          if ("number" == typeof $$obj.length) for (var $index = 0, $$l = $$obj.length; $$l > $index; $index++) {
            var project = $$obj[$index];
            tags.push(React.createElement(Item, {
              item: project
            }));
          } else {
            var $$l = 0;
            for (var $index in $$obj) {
              $$l++;
              var project = $$obj[$index];
              tags.push(React.createElement(Item, {
                item: project
              }));
            }
          }
          return tags;
        }.call(this));
        return tags;
      }.call(this))));
    }).call(this, "Item" in locals_for_with ? locals_for_with.Item : typeof Item !== "undefined" ? Item : undefined, "console" in locals_for_with ? locals_for_with.console : typeof console !== "undefined" ? console : undefined, "items" in locals_for_with ? locals_for_with.items : typeof items !== "undefined" ? items : undefined);
    if (tags.length === 1 && !Array.isArray(tags[0])) {
      return tags.pop();
    }
    tags.unshift("div", null);
    return React.createElement.apply(React, tags);
  };
  
  fn.locals = function setLocals(locals) {
    var render = this;
    function newRender(additionalLocals) {
      var newLocals = {};
      for (var key in locals) {
        newLocals[key] = locals[key];
      }
      if (additionalLocals) {
        for (var key in additionalLocals) {
          newLocals[key] = additionalLocals[key];
        }
      }
      return render.call(this, newLocals);
    }
    newRender.locals = setLocals;
    return newRender;
  };;
  return fn;
}(typeof React !== "undefined" ? React : require(".//Users/vladimir/projects/nci/node_modules/gulp-react-jade-amd/node_modules/react/react.js")));});