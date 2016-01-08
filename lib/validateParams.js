'use strict';

var conform = require('conform'),
	_ = require('underscore');

module.exports = function(params, schema, validateOptions) {
	var defaultValidateOptions = {
		additionalProperties: false,
		failOnFirstError: true,
		cast: true,
		castSource: true,
		applyDefaultValue: true
	};

	conform.validate(params, schema, _({}).extend(
		defaultValidateOptions, validateOptions
	));
	return params;
};
