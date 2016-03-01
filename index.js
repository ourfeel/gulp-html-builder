'use strict';

var fs = require('fs'),
	path = require('path'),
	gutil = require('gulp-utils'),
	through = require('through2'),
	uglifyjs = require('uglify-js'),
	uglifycss = require('uglifycss'),
	tools = require('./lib/tools'),
	_ = require('lodash');

var PLUGIN_NAME = 'gulp-html-builder';


var buildRegx =  /<!--\s*builder:\s*([\s\S]*?)\s*-->([\s\S]*?)<!--\s*builder\s+end\s*-->/gi,
	linkRegx    = /<link\s+[\s\S]*?>[\s\S]*?<*\/*>*/gi,
	scriptRegex  = /<script\s+[\s\S]*?>[\s\S]*?<\/script>/gi,
	hrefRegex    = /\s*(href)="+([\s\S]*?)"/,
	srcRegex     = /\s*(src)="+([\s\S]*?)/,
	hashRegex = /([\s\S]+?)\{\{\s*([\s\S]*?)[@|$]*hash\s*\}\}(.[\s\S]+?)$/gi;

var getFileList = function(text,regex,sourceRegex){
	var files = [];
	text.replace(regex, function($1){
		var ms = sourceRegex.exec($1);
		var link = ms[2];
		files.push(link);
	});
	return files;
}

var buildReplace = function(text,ext,file,options){
	var	fileList = [],
		content = '';

	var baseDir = options.baseDir || 'dist/assets/',
		jsDir = options.jsDir || 'js',
		cssDir = options.cssDir || 'css',
		prefix = options.prefix || '';
	switch (ext){
		case 'css':
			fileList = getFileList(text,linkRegx,hrefRegex);
			content = uglifycss.processFiles(fileList.map(function(item){
				return path.normalize(prefix + path.sep + item);
			}));
			break;
		case 'js':
			fileList = getFileList(text,scriptRegex,srcRegex);
			content = uglifyjs.minify(fileList.map(function(item){
				return path.normalize(prefix + path.sep + item);
			}));

			break;
	}
	var bs = hashRegex.exec(text);
	if(bs){
		var hash = tools.getFileHash(content,options);
		text = bs[1] + bs[2] + hash + bs[3];
	}

}

var getContent = function(file,options){
	var options = options || {},
		filterPath = options.filterPath || '';
	var fileContent = file.contents.toString('utf8');
	if(typeof fileContent === 'undefined'){
		fileContent = tools.getFileContent(file);
	}
	var content = fileContent.replace(buildRegx,function($1){
		$1 = _.trim($1);
		var ms = buildRegx.exec($1),
			buildedFile = _.trim(ms[1]);
		var ext = path.extname(buildedFile).replace(/\./gi,'');


	});
	return content;
}

var htmlBuilder = function(options){
	return through.obj(function(file,enc,next){
		if(file.isStream()){
			this.emit('erro',new PluginError(PLUGIN_NAME,'Stream content is not supported'));
			return next(null,file);
		}
		if(file.isBuffer()){
			try{
				var content = getContent(file,options);
				file.contents = content;
			}catch (e){
				this.emit('erro',new PluginError(PLUGIN_NAME,''));
			}
		}
		this.push(file);
		return next();
	});
}

module.exports = htmlBuilder;

