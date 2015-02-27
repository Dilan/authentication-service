module.exports = function(grunt) {

    var srcFiles = [
        'api/**/*.js',
        'config/**/*.js',
        'modules/**/*.js',
        'routes/**/*.js',
        'test/**/*.js',
        'app.js',
        'Gruntfile.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jscs: {
            default: {
                src: srcFiles,
                options: {
                    config: '.jscs.json'
                }
            }
        },
        jshint: {
            default: {
                src: srcFiles,
                options: {
                    jshintrc: '.jshintrc'
                }
            }
        },
        mochaTest: {
            integration: {
                options: {
                    timeout: 2000,
                    reporter: 'spec'
                },
                src: ['test/spechelper.js', 'test/integration/**/*.spec.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jscs-checker');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint:default', 'jscs:default', 'mochaTest:integration']);
};
