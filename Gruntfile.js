'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                globalstrict: true,
                globals: {
                    module: true,
                    require: true
                }
            },
            all: {
                files: {
                    src: ['**/*.js']
                },
                options: {
                    ignores: ['node_modules/**']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint']);
};
