"use strict";
const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');
const babel = require('rollup-plugin-babel');

//创建dist目录
if (!fs.existsSync('dist')) fs.mkdirSync('dist');

const time = new Date();
const banner = `/*!
 * ${require('../package.json').name}.js v${require('../package.json').version}
 * ${require('../package.json').repository.url}
 * License: MIT
 * Date: ${time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() + ' ' + time.getHours() + ':' + time.getMinutes()}
 */`;

var builds = [{
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'Crop',
    dest: 'dist/crop.js'
}, {
    env: 'production',
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'Crop',
    dest: 'dist/crop.min.js',
    uglify: true
}];

if (process.env.NODE_ENV === 'development') {
    fs.watch(path.join(__dirname, '../src/'), {
        persistent: true
    }, watch);
}


build();

function build() {
    for (let obj of builds) {
        if (!obj.env || process.env.NODE_ENV === obj.env) {
            let plugins = [
                babel({
                    presets: ['es2015-loose-rollup'],
                    exclude: ['node_modules/**']
                })
            ];

            //压缩
            if (obj.uglify) plugins.push(uglify());

            rollup.rollup({
                entry: obj.entry,
                banner: true,
                plugins: plugins
            }).then(function (bundle) {
                var code = bundle.generate({
                    format: obj.format,
                    banner: banner,
                    moduleName: obj.moduleName
                }).code;
                write(obj.dest, code);
            }, function (err) {
                console.log(err);
            });
        }
    }
}

function watch(event, filename) {
    if (event === 'rename') {
        if (!/(___jb_tmp___|___jb_old___)$/.test(filename)) {
            build();
        }
    }
}

function write(dest, code) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(dest, code, function (err) {
            if (err) return reject(err);
            console.log(blue(dest) + ' ' + getSize(code));
            resolve();
        })
    })
}

function getSize(code) {
    return (code.length / 1024).toFixed(2) + 'kb';
}

function blue(str) {
    return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m';
}
