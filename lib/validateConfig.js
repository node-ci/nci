'use strict';

var Steppy = require('twostep').Steppy,
	validateParams = require('./validateParams');

module.exports = function(config, callback) {
	Steppy(
		function() {
			validateParams(config, {
				type: 'object',
				properties: {
					plugins: {
						type: 'array',
						items: {type: 'string'}
					},
					nodes: {
						type: 'array',
						required: true,
						items: {
							type: 'object',
							properties: {
								name: {type: 'string'},
								type: {type: 'string'},
								usageStrategy: {type: 'string'},
								maxExecutorsCount: {type: 'integer'},
								options: {type: 'object'},
								envs: {
									type: 'array',
									// it could be string or regexp, but conform
									// doesn't have regexp type so object is set
									items: {type: ['string', 'object']}
								},
								envVars: {type: 'object'}
							}
						},
						minItems: 1
					},
					storage: {
						type: 'object',
						required: true,
						properties: {
							backend: {type: 'string', required: true}
						}
					},
					notify: {
						type: 'object'
					}
				},
				additionalProperties: true
			});

			this.pass(null);
		},
		function(err) {
			if (err) {
				err.message = (
					'Error during validation server config: "' + err.message
				);
			}
			callback(err, config);
		}
	);
};
