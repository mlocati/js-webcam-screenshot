/* jshint unused:vars, undef:true, node:true */

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.config.init({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v<%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			demo: {
				files: {
					'gh-pages/js/webcam-screenshot.js': ['source/webcam-screenshot.js']
				}
			}
		},
		less: {
			options: {
				compress: true
			},
	      demo: {
	        files: {
	          'gh-pages/css/webcam-screenshot.css': ['source/webcam-screenshot.less']
	        }
	      }
		},
		jsdoc: {
			main: {
				src: ['README.md', 'source/*.js'],
				options: {
					destination: 'gh-pages/docs'
				}
			}
	    },
	    jshint: {
	   	 all: ['source/*.js']
	     }
	});
	grunt.registerTask('docs', ['jsdoc']);
	grunt.registerTask('default', ['uglify','less']);
};
