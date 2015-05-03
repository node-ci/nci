define(['react'], function(React) {return (function (React) {
  var fn = function(locals) {
    var tags = [];
    var locals_for_with = locals || {};
    (function(item) {
      tags.push(React.createElement("h1", {}, item.name));
    }).call(this, "item" in locals_for_with ? locals_for_with.item : typeof item !== "undefined" ? item : undefined);
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