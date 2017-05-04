import prefixProperties from 'inline-style-prefixer/lib/static/prefixProps';
import capitalizeString from 'inline-style-prefixer/lib/utils/capitalizeString';
const prefixPropertiesArray = Object.keys(prefixProperties);

import calc from 'inline-style-prefixer/lib/static/plugins/calc';
import cursor from 'inline-style-prefixer/lib/static/plugins/cursor';
import flex from 'inline-style-prefixer/lib/static/plugins/flex';
import sizing from 'inline-style-prefixer/lib/static/plugins/sizing';
import gradient from 'inline-style-prefixer/lib/static/plugins/gradient';
import transition from 'inline-style-prefixer/lib/static/plugins/transition';

// special flexbox specifications
import flexboxIE from 'inline-style-prefixer/lib/static/plugins/flexboxIE';

import flexboxOld from 'inline-style-prefixer/lib/static/plugins/flexboxOld';

const plugins = [
  calc,
  cursor,
  sizing,
  gradient,
  transition,
  flexboxIE,
  flexboxOld,
  flex,
];

import hyphenate from './hyphenate-style-name';

export default injectStyle;

function injectStyle(styletron, styles, media, pseudo) {
  let classString = '';
  for (const key in styles) {
    const val = styles[key];
    const valType = typeof val;
    if (valType === 'string' || valType === 'number') {
      // handle vendor prefixed properties
      for (let i = 0; i < prefixPropertiesArray.length; i++) {
        const prefix = prefixPropertiesArray[i];
        const properties = prefixProperties[prefix];
        if (properties[key]) {
          const prefixedPropName = prefix + capitalizeString(key);
          classString +=
            ' ' +
            injectWithPlugins(styletron, prefixedPropName, val, media, pseudo);
        }
      }
      // handle un-prefixed
      classString +=
        ' ' + injectWithPlugins(styletron, key, val, media, pseudo);
      continue;
    }
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        classString +=
          ' ' + injectWithPlugins(styletron, key, val[i], media, pseudo);
      }
      continue;
    }
    if (valType === 'object') {
      if (key[0] === ':') {
        classString += ' ' + injectStyle(styletron, val, media, key);
        continue;
      }
      if (key.substring(0, 6) === '@media') {
        classString += ' ' + injectStyle(styletron, val, key.substr(7), pseudo);
        continue;
      }
    }
  }
  // remove leading space on way out
  return classString.slice(1);
}

function injectWithPlugins(styletron, prop, val, media, pseudo) {
  let classString = '';
  const baseHyphenated = hyphenate(prop);
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    const res = plugin(prop, val);
    if (res) {
      for (const key in res) {
        const resVal = res[key];
        const hyphenated = hyphenate(key);
        const propIsDifferent = hyphenated !== baseHyphenated;
        if (Array.isArray(resVal)) {
          for (let j = 0; j < resVal.length; j++) {
            if (propIsDifferent || resVal[j] !== val) {
              classString +=
                ' ' +
                styletron.injectDeclaration({
                  prop: hyphenated,
                  val: resVal[j],
                  media,
                  pseudo,
                });
            }
          }
        } else if (propIsDifferent || resVal !== val) {
          classString +=
            ' ' +
            styletron.injectDeclaration({
              prop: hyphenated,
              val: resVal,
              media,
              pseudo,
            });
        }
      }
    }
  }
  // inject original last
  classString +=
    ' ' +
    styletron.injectDeclaration({prop: baseHyphenated, val, media, pseudo});
  // remove leading space on way out
  return classString.slice(1);
}