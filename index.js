'use strict';

import loaderUtils from 'loader-utils';
import Hogan from 'hogan.js';
import { minify } from 'html-minifier-terser';

// TODO: remove loader-utils dependency since this.getOptions and this.stringifyRequest
//       are standard functions of webpack loaders
const { getOptions, stringifyRequest } = loaderUtils;

/**
 * Options available via:
 * https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference
 */
const minifierDefaults = {
  removeComments: true,
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  caseSensitive: true,
  ignoreCustomFragments: [/{{.*?}}/]
};

export default async function (source) {
  // const query = this.getOptions() || {};
  const query = getOptions(this) || {};
  const hoganOptions = Object.assign(
    {}, query, { asString: true }
  );

  delete hoganOptions.minify;
  delete hoganOptions.noShortcut;
  delete hoganOptions.clientSide;
  delete hoganOptions.tiny;

  // render function which will be used in output
  let render;

  if (query.render) {
    if (query.clientSide) {
      this.callback(
        new Error(
          '"render" and "clientSide" options are mutually exclusive'
        )
      );
    }

    render = typeof hoganOptions.render === 'function'
      ? hoganOptions.render()
      : hoganOptions.render;

    delete hoganOptions.render;
  }

  if (this.cacheable) {
    this.cacheable();
  }

  if (query.minify) {
    let minifierOptions = minifierDefaults;

    if (typeof (query.minify) === 'object') {
      minifierOptions = Object.assign(
        {}, minifierOptions, query.minify
      );

      console.dir(minifierOptions);
    }

    // minify html with terser minifer
    source = await minify(source, minifierOptions);
  }

  let suffix;

  if (query.noShortcut) {
    suffix = 'return T; }();';
  }
  else if (query.render) {
    suffix = `return T.render(${JSON.stringify(render)});};`;
  }
  else {
    suffix = 'return T.render.apply(T, arguments); };';
  }

  if (query.clientSide) {
    return `module.exports = async function() {
      const H = await import('hogan.js');
      const Hogan = H.default;
      const src = ${JSON.stringify(source)};

      const T = Hogan.compile(src, ${JSON.stringify(hoganOptions)});
      ${suffix}`;
  }

  if (query.tiny) {
    return `module.exports = async function() {
      const H = await import('hogan.js');
      const Hogan = H.default;

      const T = new Hogan.Template(
      ${Hogan.compile(source, hoganOptions)});
      ${suffix}`;
  }

  return `module.exports = async function() {
    const H = await import('hogan.js');
    const Hogan = H.default;
    const T = new Hogan.Template(
      ${Hogan.compile(source, hoganOptions)},
      ${JSON.stringify(source)},
      Hogan);
    ${suffix}`;
};

export function pitch (remainingRequest, precedingRequest, data) {
  if (remainingRequest.indexOf('!') >= 0) {
    const query = getOptions(this) || {};
    const hoganOptions = Object.assign({}, query);

    this.stringifyRequest()

    delete hoganOptions.minify;
    delete hoganOptions.noShortcut;
    delete hoganOptions.render;

    if (this.cacheable) {
      this.cacheable();
    }

    let suffix;
    if (query.noShortcut) {
      suffix = 'return T; }();';
    }
    else {
      suffix = 'return T.render.apply(T, arguments); };';
    }

    return `module.exports = async function() {
      const result = await import(${stringifyRequest(this, `!!${remainingRequest}`)});
      const H = await import('hogan.js');
      const Hogan = H.default;

      const T = Hogan.compile(result, ${JSON.stringify(hoganOptions)});
      ${suffix}
    }`
  }
}
