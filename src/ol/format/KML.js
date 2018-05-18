/**
 * @module ol/format/KML
 */
import {inherits} from '../index.js';
import Feature from '../Feature.js';
import {extend, includes} from '../array.js';
import {assert} from '../asserts.js';
import {asArray} from '../color.js';
import {transformWithOptions} from '../format/Feature.js';
import XMLFeature from '../format/XMLFeature.js';
import {readDecimal, readBoolean, readString, writeStringTextNode, writeCDATASection, writeDecimalTextNode, writeBooleanTextNode} from '../format/xsd.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {toRadians} from '../math.js';
import {get as getProjection} from '../proj.js';
import Fill from '../style/Fill.js';
import Icon from '../style/Icon.js';
import IconAnchorUnits from '../style/IconAnchorUnits.js';
import IconOrigin from '../style/IconOrigin.js';
import Stroke from '../style/Stroke.js';
import Style from '../style/Style.js';
import Text from '../style/Text.js';
import {createElementNS, getAllTextContent, isDocument, isNode, makeArrayExtender,
  makeArrayPusher, makeChildAppender, makeObjectPropertySetter,
  makeReplacer, makeSequence, makeSimpleNodeFactory, makeStructureNS,
  OBJECT_PROPERTY_NODE_FACTORY, parse, parseNode, pushParseAndPop,
  pushSerializeAndPop, XML_SCHEMA_INSTANCE_URI} from '../xml.js';

/**
 * @typedef {Object} Vec2
 * @property {number} x
 * @property {module:ol/style/IconAnchorUnits} xunits
 * @property {number} y
 * @property {module:ol/style/IconAnchorUnits} yunits
 * @property {module:ol/style/IconOrigin} origin
 */

/**
 * @typedef {Object} GxTrackObject
 * @property {Array.<number>} flatCoordinates
 * @property {Array.<number>} whens
 */

/**
 * @type {module:ol/color~Color}
 */
let DEFAULT_COLOR;

/**
 * @type {module:ol/style/Fill}
 */
let DEFAULT_FILL_STYLE = null;

/**
 * Get the default fill style (or null if not yet set).
 * @return {module:ol/style/Fill} The default fill style.
 */
export function getDefaultFillStyle() {
  return DEFAULT_FILL_STYLE;
}

/**
 * @type {module:ol/size~Size}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR;

/**
 * @type {module:ol/style/IconAnchorUnits}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;

/**
 * @type {module:ol/style/IconAnchorUnits}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;

/**
 * @type {module:ol/size~Size}
 */
let DEFAULT_IMAGE_STYLE_SIZE;

/**
 * @type {string}
 */
let DEFAULT_IMAGE_STYLE_SRC;

/**
 * @type {number}
 */
let DEFAULT_IMAGE_SCALE_MULTIPLIER;

/**
 * @type {module:ol/style/Image}
 */
let DEFAULT_IMAGE_STYLE = null;

/**
 * Get the default image style (or null if not yet set).
 * @return {module:ol/style/Image} The default image style.
 */
export function getDefaultImageStyle() {
  return DEFAULT_IMAGE_STYLE;
}

/**
 * @type {string}
 */
let DEFAULT_NO_IMAGE_STYLE;

/**
 * @type {module:ol/style/Stroke}
 */
let DEFAULT_STROKE_STYLE = null;

/**
 * Get the default stroke style (or null if not yet set).
 * @return {module:ol/style/Stroke} The default stroke style.
 */
export function getDefaultStrokeStyle() {
  return DEFAULT_STROKE_STYLE;
}

/**
 * @type {module:ol/style/Stroke}
 */
let DEFAULT_TEXT_STROKE_STYLE;

/**
 * @type {module:ol/style/Text}
 */
let DEFAULT_TEXT_STYLE = null;

/**
 * Get the default text style (or null if not yet set).
 * @return {module:ol/style/Text} The default text style.
 */
export function getDefaultTextStyle() {
  return DEFAULT_TEXT_STYLE;
}

/**
 * @type {module:ol/style/Style}
 */
let DEFAULT_STYLE = null;

/**
 * Get the default style (or null if not yet set).
 * @return {module:ol/style/Style} The default style.
 */
export function getDefaultStyle() {
  return DEFAULT_STYLE;
}

/**
 * @type {Array.<module:ol/style/Style>}
 */
let DEFAULT_STYLE_ARRAY = null;

/**
 * Get the default style array (or null if not yet set).
 * @return {Array.<module:ol/style/Style>} The default style.
 */
export function getDefaultStyleArray() {
  return DEFAULT_STYLE_ARRAY;
}


function createStyleDefaults() {

  DEFAULT_COLOR = [255, 255, 255, 1];

  DEFAULT_FILL_STYLE = new Fill({
    color: DEFAULT_COLOR
  });

  DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2]; // FIXME maybe [8, 32] ?

  DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = IconAnchorUnits.PIXELS;

  DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = IconAnchorUnits.PIXELS;

  DEFAULT_IMAGE_STYLE_SIZE = [64, 64];

  DEFAULT_IMAGE_STYLE_SRC =
      'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

  DEFAULT_IMAGE_SCALE_MULTIPLIER = 0.5;

  DEFAULT_IMAGE_STYLE = new Icon({
    anchor: DEFAULT_IMAGE_STYLE_ANCHOR,
    anchorOrigin: IconOrigin.BOTTOM_LEFT,
    anchorXUnits: DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS,
    anchorYUnits: DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS,
    crossOrigin: 'anonymous',
    rotation: 0,
    scale: DEFAULT_IMAGE_SCALE_MULTIPLIER,
    size: DEFAULT_IMAGE_STYLE_SIZE,
    src: DEFAULT_IMAGE_STYLE_SRC
  });

  DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';

  DEFAULT_STROKE_STYLE = new Stroke({
    color: DEFAULT_COLOR,
    width: 1
  });

  DEFAULT_TEXT_STROKE_STYLE = new Stroke({
    color: [51, 51, 51, 1],
    width: 2
  });

  DEFAULT_TEXT_STYLE = new Text({
    font: 'bold 16px Helvetica',
    fill: DEFAULT_FILL_STYLE,
    stroke: DEFAULT_TEXT_STROKE_STYLE,
    scale: 0.8
  });

  DEFAULT_STYLE = new Style({
    fill: DEFAULT_FILL_STYLE,
    image: DEFAULT_IMAGE_STYLE,
    text: DEFAULT_TEXT_STYLE,
    stroke: DEFAULT_STROKE_STYLE,
    zIndex: 0
  });

  DEFAULT_STYLE_ARRAY = [DEFAULT_STYLE];

}


/**
 * @typedef {Object} Options
 * @property {boolean} [extractStyles=true] Extract styles from the KML.
 * @property {boolean} [showPointNames=true] Show names as labels for placemarks which contain points.
 * @property {Array.<module:ol/style/Style>} [defaultStyle] Default style. The
 * default default style is the same as Google Earth.
 * @property {boolean} [writeStyles=true] Write styles into KML.
 */


/**
 * @classdesc
 * Feature format for reading and writing data in the KML format.
 *
 * Note that the KML format uses the URL() constructor. Older browsers such as IE
 * which do not support this will need a URL polyfill to be loaded before use.
 *
 * @constructor
 * @extends {module:ol/format/XMLFeature}
 * @param {module:ol/format/KML~Options=} opt_options Options.
 * @api
 */
const KML = function(opt_options) {

  const options = opt_options ? opt_options : {};

  XMLFeature.call(this);

  if (!DEFAULT_STYLE_ARRAY) {
    createStyleDefaults();
  }

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection('EPSG:4326');

  /**
   * @private
   * @type {Array.<module:ol/style/Style>}
   */
  this.defaultStyle_ = options.defaultStyle ?
    options.defaultStyle : DEFAULT_STYLE_ARRAY;

  /**
   * @private
   * @type {boolean}
   */
  this.extractStyles_ = options.extractStyles !== undefined ?
    options.extractStyles : true;

  /**
   * @private
   * @type {boolean}
   */
  this.writeStyles_ = options.writeStyles !== undefined ?
    options.writeStyles : true;

  /**
   * @private
   * @type {!Object.<string, (Array.<module:ol/style/Style>|string)>}
   */
  this.sharedStyles_ = {};

  /**
   * @private
   * @type {boolean}
   */
  this.showPointNames_ = options.showPointNames !== undefined ?
    options.showPointNames : true;

};

inherits(KML, XMLFeature);


/**
 * @const
 * @type {Array.<string>}
 */
const GX_NAMESPACE_URIS = [
  'http://www.google.com/kml/ext/2.2'
];


/**
 * @const
 * @type {Array.<string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://earth.google.com/kml/2.0',
  'http://earth.google.com/kml/2.1',
  'http://earth.google.com/kml/2.2',
  'http://www.opengis.net/kml/2.2'
];


/**
 * @const
 * @type {string}
 */
const SCHEMA_LOCATION = 'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';


/**
 * @type {Object.<string, module:ol/style/IconAnchorUnits>}
 */
const ICON_ANCHOR_UNITS_MAP = {
  'fraction': IconAnchorUnits.FRACTION,
  'pixels': IconAnchorUnits.PIXELS,
  'insetPixels': IconAnchorUnits.PIXELS
};


/**
 * @param {module:ol/style/Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {module:ol/style/Style} style Style.
 */
function createNameStyleFunction(foundStyle, name) {
  let textStyle = null;
  const textOffset = [0, 0];
  let textAlign = 'start';
  if (foundStyle.getImage()) {
    let imageSize = foundStyle.getImage().getImageSize();
    if (imageSize === null) {
      imageSize = DEFAULT_IMAGE_STYLE_SIZE;
    }
    if (imageSize.length == 2) {
      const imageScale = foundStyle.getImage().getScale();
      // Offset the label to be centered to the right of the icon, if there is
      // one.
      textOffset[0] = imageScale * imageSize[0] / 2;
      textOffset[1] = -imageScale * imageSize[1] / 2;
      textAlign = 'left';
    }
  }
  if (foundStyle.getText() !== null) {
    // clone the text style, customizing it with name, alignments and offset.
    // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
    const foundText = foundStyle.getText();
    textStyle = foundText.clone();
    textStyle.setFont(foundText.getFont() || DEFAULT_TEXT_STYLE.getFont());
    textStyle.setScale(foundText.getScale() || DEFAULT_TEXT_STYLE.getScale());
    textStyle.setFill(foundText.getFill() || DEFAULT_TEXT_STYLE.getFill());
    textStyle.setStroke(foundText.getStroke() || DEFAULT_TEXT_STROKE_STYLE);
  } else {
    textStyle = DEFAULT_TEXT_STYLE.clone();
  }
  textStyle.setText(name);
  textStyle.setOffsetX(textOffset[0]);
  textStyle.setOffsetY(textOffset[1]);
  textStyle.setTextAlign(textAlign);

  const nameStyle = new Style({
    text: textStyle
  });
  return nameStyle;
}


/**
 * @param {Array.<module:ol/style/Style>|undefined} style Style.
 * @param {string} styleUrl Style URL.
 * @param {Array.<module:ol/style/Style>} defaultStyle Default style.
 * @param {!Object.<string, (Array.<module:ol/style/Style>|string)>} sharedStyles Shared styles.
 * @param {boolean|undefined} showPointNames true to show names for point placemarks.
 * @return {module:ol/style/Style~StyleFunction} Feature style function.
 */
function createFeatureStyleFunction(style, styleUrl, defaultStyle, sharedStyles, showPointNames) {

  return (
    /**
     * @param {module:ol/Feature} feature feature.
     * @param {number} resolution Resolution.
     * @return {Array.<module:ol/style/Style>} Style.
     */
    function(feature, resolution) {
      let drawName = showPointNames;
      /** @type {module:ol/style/Style|undefined} */
      let nameStyle;
      let name = '';
      if (drawName) {
        const geometry = feature.getGeometry();
        if (geometry) {
          drawName = geometry.getType() === GeometryType.POINT;
        }
      }

      if (drawName) {
        name = /** @type {string} */ (feature.get('name'));
        drawName = drawName && name;
      }

      if (style) {
        if (drawName) {
          nameStyle = createNameStyleFunction(style[0], name);
          return style.concat(nameStyle);
        }
        return style;
      }
      if (styleUrl) {
        const foundStyle = findStyle(styleUrl, defaultStyle, sharedStyles);
        if (drawName) {
          nameStyle = createNameStyleFunction(foundStyle[0], name);
          return foundStyle.concat(nameStyle);
        }
        return foundStyle;
      }
      if (drawName) {
        nameStyle = createNameStyleFunction(defaultStyle[0], name);
        return defaultStyle.concat(nameStyle);
      }
      return defaultStyle;
    }
  );
}


/**
 * @param {Array.<module:ol/style/Style>|string|undefined} styleValue Style value.
 * @param {Array.<module:ol/style/Style>} defaultStyle Default style.
 * @param {!Object.<string, (Array.<module:ol/style/Style>|string)>} sharedStyles
 * Shared styles.
 * @return {Array.<module:ol/style/Style>} Style.
 */
function findStyle(styleValue, defaultStyle, sharedStyles) {
  if (Array.isArray(styleValue)) {
    return styleValue;
  } else if (typeof styleValue === 'string') {
    // KML files in the wild occasionally forget the leading `#` on styleUrls
    // defined in the same document.  Add a leading `#` if it enables to find
    // a style.
    if (!(styleValue in sharedStyles) && ('#' + styleValue in sharedStyles)) {
      styleValue = '#' + styleValue;
    }
    return findStyle(sharedStyles[styleValue], defaultStyle, sharedStyles);
  } else {
    return defaultStyle;
  }
}


/**
 * @param {Node} node Node.
 * @return {module:ol/color~Color|undefined} Color.
 */
function readColor(node) {
  const s = getAllTextContent(node, false);
  // The KML specification states that colors should not include a leading `#`
  // but we tolerate them.
  const m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    const hexColor = m[1];
    return [
      parseInt(hexColor.substr(6, 2), 16),
      parseInt(hexColor.substr(4, 2), 16),
      parseInt(hexColor.substr(2, 2), 16),
      parseInt(hexColor.substr(0, 2), 16) / 255
    ];

  } else {
    return undefined;
  }
}


/**
 * @param {Node} node Node.
 * @return {Array.<number>|undefined} Flat coordinates.
 */
export function readFlatCoordinates(node) {
  let s = getAllTextContent(node, false);
  const flatCoordinates = [];
  // The KML specification states that coordinate tuples should not include
  // spaces, but we tolerate them.
  const re =
      /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i;
  let m;
  while ((m = re.exec(s))) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = m[3] ? parseFloat(m[3]) : 0;
    flatCoordinates.push(x, y, z);
    s = s.substr(m[0].length);
  }
  if (s !== '') {
    return undefined;
  }
  return flatCoordinates;
}


/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readURI(node) {
  const s = getAllTextContent(node, false).trim();
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL(s, baseURI);
    return url.href;
  } else {
    return s;
  }
}


/**
 * @param {Node} node Node.
 * @return {module:ol/format/KML~Vec2} Vec2.
 */
function readVec2(node) {
  const xunits = node.getAttribute('xunits');
  const yunits = node.getAttribute('yunits');
  let origin;
  if (xunits !== 'insetPixels') {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_LEFT;
    } else {
      origin = IconOrigin.TOP_LEFT;
    }
  } else {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_RIGHT;
    } else {
      origin = IconOrigin.TOP_RIGHT;
    }
  }
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: ICON_ANCHOR_UNITS_MAP[xunits],
    y: parseFloat(node.getAttribute('y')),
    yunits: ICON_ANCHOR_UNITS_MAP[yunits],
    origin: origin
  };
}


/**
 * @param {Node} node Node.
 * @return {number|undefined} Scale.
 */
function readScale(node) {
  return readDecimal(node);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const STYLE_MAP_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Pair': pairDataParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<module:ol/style/Style>|string|undefined} StyleMap.
 */
function readStyleMapValue(node, objectStack) {
  return pushParseAndPop(undefined,
    STYLE_MAP_PARSERS, node, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const ICON_STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Icon': makeObjectPropertySetter(readIcon),
    'heading': makeObjectPropertySetter(readDecimal),
    'hotSpot': makeObjectPropertySetter(readVec2),
    'scale': makeObjectPropertySetter(readScale)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function iconStyleParser(node, objectStack) {
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  const object = pushParseAndPop(
    {}, ICON_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const IconObject = 'Icon' in object ? object['Icon'] : {};
  const drawIcon = (!('Icon' in object) || Object.keys(IconObject).length > 0);
  let src;
  const href = /** @type {string|undefined} */
      (IconObject['href']);
  if (href) {
    src = href;
  } else if (drawIcon) {
    src = DEFAULT_IMAGE_STYLE_SRC;
  }
  let anchor, anchorXUnits, anchorYUnits;
  let anchorOrigin = IconOrigin.BOTTOM_LEFT;
  const hotSpot = /** @type {module:ol/format/KML~Vec2|undefined} */
      (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
    anchorOrigin = hotSpot.origin;
  } else if (src === DEFAULT_IMAGE_STYLE_SRC) {
    anchor = DEFAULT_IMAGE_STYLE_ANCHOR;
    anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
    anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
  } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
    anchor = [0.5, 0];
    anchorXUnits = IconAnchorUnits.FRACTION;
    anchorYUnits = IconAnchorUnits.FRACTION;
  }

  let offset;
  const x = /** @type {number|undefined} */
      (IconObject['x']);
  const y = /** @type {number|undefined} */
      (IconObject['y']);
  if (x !== undefined && y !== undefined) {
    offset = [x, y];
  }

  let size;
  const w = /** @type {number|undefined} */
      (IconObject['w']);
  const h = /** @type {number|undefined} */
      (IconObject['h']);
  if (w !== undefined && h !== undefined) {
    size = [w, h];
  }

  let rotation;
  const heading = /** @type {number} */
      (object['heading']);
  if (heading !== undefined) {
    rotation = toRadians(heading);
  }

  let scale = /** @type {number|undefined} */
      (object['scale']);

  if (drawIcon) {
    if (src == DEFAULT_IMAGE_STYLE_SRC) {
      size = DEFAULT_IMAGE_STYLE_SIZE;
      if (scale === undefined) {
        scale = DEFAULT_IMAGE_SCALE_MULTIPLIER;
      }
    }

    const imageStyle = new Icon({
      anchor: anchor,
      anchorOrigin: anchorOrigin,
      anchorXUnits: anchorXUnits,
      anchorYUnits: anchorYUnits,
      crossOrigin: 'anonymous', // FIXME should this be configurable?
      offset: offset,
      offsetOrigin: IconOrigin.BOTTOM_LEFT,
      rotation: rotation,
      scale: scale,
      size: size,
      src: src
    });
    styleObject['imageStyle'] = imageStyle;
  } else {
    // handle the case when we explicitly want to draw no icon.
    styleObject['imageStyle'] = DEFAULT_NO_IMAGE_STYLE;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LABEL_STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'scale': makeObjectPropertySetter(readScale)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function labelStyleParser(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop(
    {}, LABEL_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const textStyle = new Text({
    fill: new Fill({
      color: /** @type {module:ol/color~Color} */
          ('color' in object ? object['color'] : DEFAULT_COLOR)
    }),
    scale: /** @type {number|undefined} */
        (object['scale'])
  });
  styleObject['textStyle'] = textStyle;
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LINE_STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'width': makeObjectPropertySetter(readDecimal)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function lineStyleParser(node, objectStack) {
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  const object = pushParseAndPop(
    {}, LINE_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const strokeStyle = new Stroke({
    color: /** @type {module:ol/color~Color} */
        ('color' in object ? object['color'] : DEFAULT_COLOR),
    width: /** @type {number} */ ('width' in object ? object['width'] : 1)
  });
  styleObject['strokeStyle'] = strokeStyle;
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const POLY_STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'fill': makeObjectPropertySetter(readBoolean),
    'outline': makeObjectPropertySetter(readBoolean)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function polyStyleParser(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop(
    {}, POLY_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const fillStyle = new Fill({
    color: /** @type {module:ol/color~Color} */
        ('color' in object ? object['color'] : DEFAULT_COLOR)
  });
  styleObject['fillStyle'] = fillStyle;
  const fill = /** @type {boolean|undefined} */ (object['fill']);
  if (fill !== undefined) {
    styleObject['fill'] = fill;
  }
  const outline = /** @type {boolean|undefined} */ (object['outline']);
  if (outline !== undefined) {
    styleObject['outline'] = outline;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const FLAT_LINEAR_RING_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'coordinates': makeReplacer(readFlatCoordinates)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<number>} LinearRing flat coordinates.
 */
function readFlatLinearRing(node, objectStack) {
  return pushParseAndPop(null,
    FLAT_LINEAR_RING_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function gxCoordParser(node, objectStack) {
  const gxTrackObject = /** @type {module:ol/format/KML~GxTrackObject} */
      (objectStack[objectStack.length - 1]);
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const s = getAllTextContent(node, false);
  const re =
      /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
  const m = re.exec(s);
  if (m) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = parseFloat(m[3]);
    flatCoordinates.push(x, y, z, 0);
  } else {
    flatCoordinates.push(0, 0, 0, 0);
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const GX_MULTITRACK_GEOMETRY_PARSERS = makeStructureNS(
  GX_NAMESPACE_URIS, {
    'Track': makeArrayPusher(readGxTrack)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/MultiLineString|undefined} MultiLineString.
 */
function readGxMultiTrack(node, objectStack) {
  const lineStrings = pushParseAndPop([],
    GX_MULTITRACK_GEOMETRY_PARSERS, node, objectStack);
  if (!lineStrings) {
    return undefined;
  }
  const multiLineString = new MultiLineString(null);
  multiLineString.setLineStrings(lineStrings);
  return multiLineString;
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const GX_TRACK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'when': whenParser
  }, makeStructureNS(
    GX_NAMESPACE_URIS, {
      'coord': gxCoordParser
    }));


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/LineString|undefined} LineString.
 */
function readGxTrack(node, objectStack) {
  const gxTrackObject = pushParseAndPop(
    /** @type {module:ol/format/KML~GxTrackObject} */ ({
      flatCoordinates: [],
      whens: []
    }), GX_TRACK_PARSERS, node, objectStack);
  if (!gxTrackObject) {
    return undefined;
  }
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const whens = gxTrackObject.whens;
  for (let i = 0, ii = Math.min(flatCoordinates.length, whens.length); i < ii; ++i) {
    flatCoordinates[4 * i + 3] = whens[i];
  }
  const lineString = new LineString(null);
  lineString.setFlatCoordinates(GeometryLayout.XYZM, flatCoordinates);
  return lineString;
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const ICON_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'href': makeObjectPropertySetter(readURI)
  }, makeStructureNS(
    GX_NAMESPACE_URIS, {
      'x': makeObjectPropertySetter(readDecimal),
      'y': makeObjectPropertySetter(readDecimal),
      'w': makeObjectPropertySetter(readDecimal),
      'h': makeObjectPropertySetter(readDecimal)
    }));


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Icon object.
 */
function readIcon(node, objectStack) {
  const iconObject = pushParseAndPop(
    {}, ICON_PARSERS, node, objectStack);
  if (iconObject) {
    return iconObject;
  } else {
    return null;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const GEOMETRY_FLAT_COORDINATES_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'coordinates': makeReplacer(readFlatCoordinates)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<number>} Flat coordinates.
 */
function readFlatCoordinatesFromNode(node, objectStack) {
  return pushParseAndPop(null,
    GEOMETRY_FLAT_COORDINATES_PARSERS, node, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const EXTRUDE_AND_ALTITUDE_MODE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'extrude': makeObjectPropertySetter(readBoolean),
    'tessellate': makeObjectPropertySetter(readBoolean),
    'altitudeMode': makeObjectPropertySetter(readString)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/LineString|undefined} LineString.
 */
function readLineString(node, objectStack) {
  const properties = pushParseAndPop({},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
    objectStack);
  const flatCoordinates =
      readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const lineString = new LineString(null);
    lineString.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    lineString.setProperties(properties);
    return lineString;
  } else {
    return undefined;
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/Polygon|undefined} Polygon.
 */
function readLinearRing(node, objectStack) {
  const properties = pushParseAndPop({},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
    objectStack);
  const flatCoordinates =
      readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const polygon = new Polygon(null);
    polygon.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates,
      [flatCoordinates.length]);
    polygon.setProperties(properties);
    return polygon;
  } else {
    return undefined;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const MULTI_GEOMETRY_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LineString': makeArrayPusher(readLineString),
    'LinearRing': makeArrayPusher(readLinearRing),
    'MultiGeometry': makeArrayPusher(readMultiGeometry),
    'Point': makeArrayPusher(readPoint),
    'Polygon': makeArrayPusher(readPolygon)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/Geometry} Geometry.
 */
function readMultiGeometry(node, objectStack) {
  const geometries = pushParseAndPop([],
    MULTI_GEOMETRY_PARSERS, node, objectStack);
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new GeometryCollection(geometries);
  }
  /** @type {module:ol/geom/Geometry} */
  let multiGeometry;
  let homogeneous = true;
  const type = geometries[0].getType();
  let geometry;
  for (let i = 1, ii = geometries.length; i < ii; ++i) {
    geometry = geometries[i];
    if (geometry.getType() != type) {
      homogeneous = false;
      break;
    }
  }
  if (homogeneous) {
    let layout;
    let flatCoordinates;
    if (type == GeometryType.POINT) {
      const point = geometries[0];
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (let i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      multiGeometry = new MultiPoint(null);
      multiGeometry.setFlatCoordinates(layout, flatCoordinates);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.LINE_STRING) {
      multiGeometry = new MultiLineString(null);
      multiGeometry.setLineStrings(geometries);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.POLYGON) {
      multiGeometry = new MultiPolygon(null);
      multiGeometry.setPolygons(geometries);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.GEOMETRY_COLLECTION) {
      multiGeometry = new GeometryCollection(geometries);
    } else {
      assert(false, 37); // Unknown geometry type found
    }
  } else {
    multiGeometry = new GeometryCollection(geometries);
  }
  return (
    /** @type {module:ol/geom/Geometry} */ (multiGeometry)
  );
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/Point|undefined} Point.
 */
function readPoint(node, objectStack) {
  const properties = pushParseAndPop({},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
    objectStack);
  const flatCoordinates =
      readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const point = new Point(null);
    point.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    point.setProperties(properties);
    return point;
  } else {
    return undefined;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const FLAT_LINEAR_RINGS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'innerBoundaryIs': innerBoundaryIsParser,
    'outerBoundaryIs': outerBoundaryIsParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/Polygon|undefined} Polygon.
 */
function readPolygon(node, objectStack) {
  const properties = pushParseAndPop(/** @type {Object<string,*>} */ ({}),
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
    objectStack);
  const flatLinearRings = pushParseAndPop([null],
    FLAT_LINEAR_RINGS_PARSERS, node, objectStack);
  if (flatLinearRings && flatLinearRings[0]) {
    const polygon = new Polygon(null);
    const flatCoordinates = flatLinearRings[0];
    const ends = [flatCoordinates.length];
    for (let i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates, ends);
    polygon.setProperties(properties);
    return polygon;
  } else {
    return undefined;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'IconStyle': iconStyleParser,
    'LabelStyle': labelStyleParser,
    'LineStyle': lineStyleParser,
    'PolyStyle': polyStyleParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<module:ol/style/Style>} Style.
 */
function readStyle(node, objectStack) {
  const styleObject = pushParseAndPop(
    {}, STYLE_PARSERS, node, objectStack);
  if (!styleObject) {
    return null;
  }
  let fillStyle = /** @type {module:ol/style/Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : DEFAULT_FILL_STYLE);
  const fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  let imageStyle = /** @type {module:ol/style/Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : DEFAULT_IMAGE_STYLE);
  if (imageStyle == DEFAULT_NO_IMAGE_STYLE) {
    imageStyle = undefined;
  }
  const textStyle = /** @type {module:ol/style/Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : DEFAULT_TEXT_STYLE);
  let strokeStyle = /** @type {module:ol/style/Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : DEFAULT_STROKE_STYLE);
  const outline = /** @type {boolean|undefined} */
      (styleObject['outline']);
  if (outline !== undefined && !outline) {
    strokeStyle = null;
  }
  return [new Style({
    fill: fillStyle,
    image: imageStyle,
    stroke: strokeStyle,
    text: textStyle,
    zIndex: undefined // FIXME
  })];
}


/**
 * Reads an array of geometries and creates arrays for common geometry
 * properties. Then sets them to the multi geometry.
 * @param {module:ol/geom/MultiPoint|module:ol/geom/MultiLineString|module:ol/geom/MultiPolygon}
 *     multiGeometry A multi-geometry.
 * @param {Array.<module:ol/geom/Geometry>} geometries List of geometries.
 */
function setCommonGeometryProperties(multiGeometry, geometries) {
  const ii = geometries.length;
  const extrudes = new Array(geometries.length);
  const tessellates = new Array(geometries.length);
  const altitudeModes = new Array(geometries.length);
  let hasExtrude, hasTessellate, hasAltitudeMode;
  hasExtrude = hasTessellate = hasAltitudeMode = false;
  for (let i = 0; i < ii; ++i) {
    const geometry = geometries[i];
    extrudes[i] = geometry.get('extrude');
    tessellates[i] = geometry.get('tessellate');
    altitudeModes[i] = geometry.get('altitudeMode');
    hasExtrude = hasExtrude || extrudes[i] !== undefined;
    hasTessellate = hasTessellate || tessellates[i] !== undefined;
    hasAltitudeMode = hasAltitudeMode || altitudeModes[i];
  }
  if (hasExtrude) {
    multiGeometry.set('extrude', extrudes);
  }
  if (hasTessellate) {
    multiGeometry.set('tessellate', tessellates);
  }
  if (hasAltitudeMode) {
    multiGeometry.set('altitudeMode', altitudeModes);
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const DATA_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'displayName': makeObjectPropertySetter(readString),
    'value': makeObjectPropertySetter(readString)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function dataParser(node, objectStack) {
  const name = node.getAttribute('name');
  parseNode(DATA_PARSERS, node, objectStack);
  const featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  if (name !== null) {
    featureObject[name] = featureObject.value;
  } else if (featureObject.displayName !== null) {
    featureObject[featureObject.displayName] = featureObject.value;
  }
  delete featureObject['value'];
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const EXTENDED_DATA_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Data': dataParser,
    'SchemaData': schemaDataParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function extendedDataParser(node, objectStack) {
  parseNode(EXTENDED_DATA_PARSERS, node, objectStack);
}

/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const REGION_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LatLonAltBox': latLonAltBoxParser,
    'Lod': lodParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function regionParser(node, objectStack) {
  parseNode(REGION_PARSERS, node, objectStack);
}

/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const PAIR_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Style': makeObjectPropertySetter(readStyle),
    'key': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readURI)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function pairDataParser(node, objectStack) {
  const pairObject = pushParseAndPop(
    {}, PAIR_PARSERS, node, objectStack);
  if (!pairObject) {
    return;
  }
  const key = /** @type {string|undefined} */
      (pairObject['key']);
  if (key && key == 'normal') {
    const styleUrl = /** @type {string|undefined} */
        (pairObject['styleUrl']);
    if (styleUrl) {
      objectStack[objectStack.length - 1] = styleUrl;
    }
    const Style = /** @type {module:ol/style/Style} */
        (pairObject['Style']);
    if (Style) {
      objectStack[objectStack.length - 1] = Style;
    }
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function placemarkStyleMapParser(node, objectStack) {
  const styleMapValue = readStyleMapValue(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  const placemarkObject = objectStack[objectStack.length - 1];
  if (Array.isArray(styleMapValue)) {
    placemarkObject['Style'] = styleMapValue;
  } else if (typeof styleMapValue === 'string') {
    placemarkObject['styleUrl'] = styleMapValue;
  } else {
    assert(false, 38); // `styleMapValue` has an unknown type
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const SCHEMA_DATA_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'SimpleData': simpleDataParser
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function schemaDataParser(node, objectStack) {
  parseNode(SCHEMA_DATA_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function simpleDataParser(node, objectStack) {
  const name = node.getAttribute('name');
  if (name !== null) {
    const data = readString(node);
    const featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    featureObject[name] = data;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LAT_LON_ALT_BOX_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'altitudeMode': makeObjectPropertySetter(readString),
    'minAltitude': makeObjectPropertySetter(readDecimal),
    'maxAltitude': makeObjectPropertySetter(readDecimal),
    'north': makeObjectPropertySetter(readDecimal),
    'south': makeObjectPropertySetter(readDecimal),
    'east': makeObjectPropertySetter(readDecimal),
    'west': makeObjectPropertySetter(readDecimal)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function latLonAltBoxParser(node, objectStack) {
  const object = pushParseAndPop({}, LAT_LON_ALT_BOX_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const regionObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const extent = [
    parseFloat(object['west']),
    parseFloat(object['south']),
    parseFloat(object['east']),
    parseFloat(object['north'])
  ];
  regionObject['extent'] = extent;
  regionObject['altitudeMode'] = object['altitudeMode'];
  regionObject['minAltitude'] = parseFloat(object['minAltitude']);
  regionObject['maxAltitude'] = parseFloat(object['maxAltitude']);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LOD_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'minLodPixels': makeObjectPropertySetter(readDecimal),
    'maxLodPixels': makeObjectPropertySetter(readDecimal),
    'minFadeExtent': makeObjectPropertySetter(readDecimal),
    'maxFadeExtent': makeObjectPropertySetter(readDecimal)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function lodParser(node, objectStack) {
  const object = pushParseAndPop({}, LOD_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  lodObject['minLodPixels'] = parseFloat(object['minLodPixels']);
  lodObject['maxLodPixels'] = parseFloat(object['maxLodPixels']);
  lodObject['minFadeExtent'] = parseFloat(object['minFadeExtent']);
  lodObject['maxFadeExtent'] = parseFloat(object['maxFadeExtent']);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const INNER_BOUNDARY_IS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LinearRing': makeReplacer(readFlatLinearRing)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function innerBoundaryIsParser(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  const flatLinearRing = pushParseAndPop(undefined,
    INNER_BOUNDARY_IS_PARSERS, node, objectStack);
  if (flatLinearRing) {
    const flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings.push(flatLinearRing);
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const OUTER_BOUNDARY_IS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LinearRing': makeReplacer(readFlatLinearRing)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function outerBoundaryIsParser(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  const flatLinearRing = pushParseAndPop(undefined,
    OUTER_BOUNDARY_IS_PARSERS, node, objectStack);
  if (flatLinearRing) {
    const flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings[0] = flatLinearRing;
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const NETWORK_LINK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ExtendedData': extendedDataParser,
    'Region': regionParser,
    'Link': linkParser,
    'address': makeObjectPropertySetter(readString),
    'description': makeObjectPropertySetter(readString),
    'name': makeObjectPropertySetter(readString),
    'open': makeObjectPropertySetter(readBoolean),
    'phoneNumber': makeObjectPropertySetter(readString),
    'visibility': makeObjectPropertySetter(readBoolean)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LINK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'href': makeObjectPropertySetter(readURI)
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function linkParser(node, objectStack) {
  parseNode(LINK_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function whenParser(node, objectStack) {
  const gxTrackObject = /** @type {module:ol/format/KML~GxTrackObject} */
      (objectStack[objectStack.length - 1]);
  const whens = gxTrackObject.whens;
  const s = getAllTextContent(node, false);
  const when = Date.parse(s);
  whens.push(isNaN(when) ? 0 : when);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const PLACEMARK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ExtendedData': extendedDataParser,
    'Region': regionParser,
    'MultiGeometry': makeObjectPropertySetter(
      readMultiGeometry, 'geometry'),
    'LineString': makeObjectPropertySetter(
      readLineString, 'geometry'),
    'LinearRing': makeObjectPropertySetter(
      readLinearRing, 'geometry'),
    'Point': makeObjectPropertySetter(
      readPoint, 'geometry'),
    'Polygon': makeObjectPropertySetter(
      readPolygon, 'geometry'),
    'Style': makeObjectPropertySetter(readStyle),
    'StyleMap': placemarkStyleMapParser,
    'address': makeObjectPropertySetter(readString),
    'description': makeObjectPropertySetter(readString),
    'name': makeObjectPropertySetter(readString),
    'open': makeObjectPropertySetter(readBoolean),
    'phoneNumber': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readURI),
    'visibility': makeObjectPropertySetter(readBoolean)
  }, makeStructureNS(
    GX_NAMESPACE_URIS, {
      'MultiTrack': makeObjectPropertySetter(
        readGxMultiTrack, 'geometry'),
      'Track': makeObjectPropertySetter(
        readGxTrack, 'geometry')
    }
  ));


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<module:ol/Feature>|undefined} Features.
 */
KML.prototype.readDocumentOrFolder_ = function(node, objectStack) {
  // FIXME use scope somehow
  const parsersNS = makeStructureNS(
    NAMESPACE_URIS, {
      'Document': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Folder': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Placemark': makeArrayPusher(this.readPlacemark_, this),
      'Style': this.readSharedStyle_.bind(this),
      'StyleMap': this.readSharedStyleMap_.bind(this)
    });
  /** @type {Array.<module:ol/Feature>} */
  const features = pushParseAndPop([], parsersNS, node, objectStack, this);
  if (features) {
    return features;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {module:ol/Feature|undefined} Feature.
 */
KML.prototype.readPlacemark_ = function(node, objectStack) {
  const object = pushParseAndPop({'geometry': null},
    PLACEMARK_PARSERS, node, objectStack);
  if (!object) {
    return undefined;
  }
  const feature = new Feature();
  const id = node.getAttribute('id');
  if (id !== null) {
    feature.setId(id);
  }
  const options = /** @type {module:ol/format/Feature~ReadOptions} */ (objectStack[0]);

  const geometry = object['geometry'];
  if (geometry) {
    transformWithOptions(geometry, false, options);
  }
  feature.setGeometry(geometry);
  delete object['geometry'];

  if (this.extractStyles_) {
    const style = object['Style'];
    const styleUrl = object['styleUrl'];
    const styleFunction = createFeatureStyleFunction(
      style, styleUrl, this.defaultStyle_, this.sharedStyles_,
      this.showPointNames_);
    feature.setStyle(styleFunction);
  }
  delete object['Style'];
  // we do not remove the styleUrl property from the object, so it
  // gets stored on feature when setProperties is called

  feature.setProperties(object);

  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.prototype.readSharedStyle_ = function(node, objectStack) {
  const id = node.getAttribute('id');
  if (id !== null) {
    const style = readStyle(node, objectStack);
    if (style) {
      let styleUri;
      let baseURI = node.baseURI;
      if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
      }
      if (baseURI) {
        const url = new URL('#' + id, baseURI);
        styleUri = url.href;
      } else {
        styleUri = '#' + id;
      }
      this.sharedStyles_[styleUri] = style;
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.prototype.readSharedStyleMap_ = function(node, objectStack) {
  const id = node.getAttribute('id');
  if (id === null) {
    return;
  }
  const styleMapValue = readStyleMapValue(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  let styleUri;
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL('#' + id, baseURI);
    styleUri = url.href;
  } else {
    styleUri = '#' + id;
  }
  this.sharedStyles_[styleUri] = styleMapValue;
};


/**
 * Read the first feature from a KML source. MultiGeometries are converted into
 * GeometryCollections if they are a mix of geometry types, and into MultiPoint/
 * MultiLineString/MultiPolygon if they are all of the same type.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
KML.prototype.readFeature;


/**
 * @inheritDoc
 */
KML.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
    return null;
  }
  const feature = this.readPlacemark_(
    node, [this.getReadOptions(node, opt_options)]);
  if (feature) {
    return feature;
  } else {
    return null;
  }
};


/**
 * Read all features from a KML source. MultiGeometries are converted into
 * GeometryCollections if they are a mix of geometry types, and into MultiPoint/
 * MultiLineString/MultiPolygon if they are all of the same type.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
KML.prototype.readFeatures;


/**
 * @inheritDoc
 */
KML.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
    return [];
  }
  let features;
  const localName = node.localName;
  if (localName == 'Document' || localName == 'Folder') {
    features = this.readDocumentOrFolder_(
      node, [this.getReadOptions(node, opt_options)]);
    if (features) {
      return features;
    } else {
      return [];
    }
  } else if (localName == 'Placemark') {
    const feature = this.readPlacemark_(
      node, [this.getReadOptions(node, opt_options)]);
    if (feature) {
      return [feature];
    } else {
      return [];
    }
  } else if (localName == 'kml') {
    features = [];
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      const fs = this.readFeaturesFromNode(n, opt_options);
      if (fs) {
        extend(features, fs);
      }
    }
    return features;
  } else {
    return [];
  }
};


/**
 * Read the name of the KML.
 *
 * @param {Document|Node|string} source Source.
 * @return {string|undefined} Name.
 * @api
 */
KML.prototype.readName = function(source) {
  if (isDocument(source)) {
    return this.readNameFromDocument(/** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readNameFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readNameFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {string|undefined} Name.
 */
KML.prototype.readNameFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      const name = this.readNameFromNode(n);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
};


/**
 * @param {Node} node Node.
 * @return {string|undefined} Name.
 */
KML.prototype.readNameFromNode = function(node) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        n.localName == 'name') {
      return readString(n);
    }
  }
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'Placemark' ||
         localName == 'kml')) {
      const name = this.readNameFromNode(n);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
};


/**
 * Read the network links of the KML.
 *
 * @param {Document|Node|string} source Source.
 * @return {Array.<Object>} Network links.
 * @api
 */
KML.prototype.readNetworkLinks = function(source) {
  const networkLinks = [];
  if (isDocument(source)) {
    extend(networkLinks, this.readNetworkLinksFromDocument(
      /** @type {Document} */ (source)));
  } else if (isNode(source)) {
    extend(networkLinks, this.readNetworkLinksFromNode(
      /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    extend(networkLinks, this.readNetworkLinksFromDocument(doc));
  }
  return networkLinks;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Network links.
 */
KML.prototype.readNetworkLinksFromDocument = function(doc) {
  const networkLinks = [];
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Network links.
 */
KML.prototype.readNetworkLinksFromNode = function(node) {
  const networkLinks = [];
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        n.localName == 'NetworkLink') {
      const obj = pushParseAndPop({}, NETWORK_LINK_PARSERS,
        n, []);
      networkLinks.push(obj);
    }
  }
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * Read the regions of the KML.
 *
 * @param {Document|Node|string} source Source.
 * @return {Array.<Object>} Regions.
 * @api
 */
KML.prototype.readRegion = function(source) {
  const regions = [];
  if (isDocument(source)) {
    extend(regions, this.readRegionFromDocument(
      /** @type {Document} */ (source)));
  } else if (isNode(source)) {
    extend(regions, this.readRegionFromNode(
      /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    extend(regions, this.readRegionFromDocument(doc));
  }
  return regions;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Region.
 */
KML.prototype.readRegionFromDocument = function(doc) {
  const regions = [];
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Region.
 * @api
 */
KML.prototype.readRegionFromNode = function(node) {
  const regions = [];
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        n.localName == 'Region') {
      const obj = pushParseAndPop({}, REGION_PARSERS,
        n, []);
      regions.push(obj);
    }
  }
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * Read the projection from a KML source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
KML.prototype.readProjection;


/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {module:ol/color~Color|string} color Color.
 */
function writeColorTextNode(node, color) {
  const rgba = asArray(color);
  const opacity = (rgba.length == 4) ? rgba[3] : 1;
  const abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  for (let i = 0; i < 4; ++i) {
    const hex = parseInt(abgr[i], 10).toString(16);
    abgr[i] = (hex.length == 1) ? '0' + hex : hex;
  }
  writeStringTextNode(node, abgr.join(''));
}


/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array.<number>} coordinates Coordinates.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeCoordinatesTextNode(node, coordinates, objectStack) {
  const context = objectStack[objectStack.length - 1];

  const layout = context['layout'];
  const stride = context['stride'];

  let dimension;
  if (layout == GeometryLayout.XY ||
      layout == GeometryLayout.XYM) {
    dimension = 2;
  } else if (layout == GeometryLayout.XYZ ||
      layout == GeometryLayout.XYZM) {
    dimension = 3;
  } else {
    assert(false, 34); // Invalid geometry layout
  }

  const ii = coordinates.length;
  let text = '';
  if (ii > 0) {
    text += coordinates[0];
    for (let d = 1; d < dimension; ++d) {
      text += ',' + coordinates[d];
    }
    for (let i = stride; i < ii; i += stride) {
      text += ' ' + coordinates[i];
      for (let d = 1; d < dimension; ++d) {
        text += ',' + coordinates[i + d];
      }
    }
  }
  writeStringTextNode(node, text);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const EXTENDEDDATA_NODE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Data': makeChildAppender(writeDataNode),
    'value': makeChildAppender(writeDataNodeValue),
    'displayName': makeChildAppender(writeDataNodeName)
  });


/**
 * @param {Node} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeDataNode(node, pair, objectStack) {
  node.setAttribute('name', pair.name);
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
    }

    if (value !== null && value.value) {
      pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
    }
  } else {
    pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
  }
}


/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 */
function writeDataNodeName(node, name) {
  writeCDATASection(node, name);
}


/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 */
function writeDataNodeValue(node, value) {
  writeStringTextNode(node, value);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const DOCUMENT_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Placemark': makeChildAppender(writePlacemark)
  });


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const DOCUMENT_NODE_FACTORY = function(value, objectStack, opt_nodeName) {
  const parentNode = objectStack[objectStack.length - 1].node;
  return createElementNS(parentNode.namespaceURI, 'Placemark');
};


/**
 * @param {Node} node Node.
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {Array.<*>} objectStack Object stack.
 * @this {module:ol/format/KML}
 */
function writeDocument(node, features, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context, DOCUMENT_SERIALIZERS,
    DOCUMENT_NODE_FACTORY, features, objectStack, undefined,
    this);
}


/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 */
const DATA_NODE_FACTORY = makeSimpleNodeFactory('Data');


/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeExtendedData(node, namesAndValues, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const names = namesAndValues.names;
  const values = namesAndValues.values;
  const length = names.length;

  for (let i = 0; i < length; i++) {
    pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
      DATA_NODE_FACTORY, [{name: names[i], value: values[i]}], objectStack);
  }
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const ICON_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'href'
  ],
  makeStructureNS(GX_NAMESPACE_URIS, [
    'x', 'y', 'w', 'h'
  ]));


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const ICON_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'href': makeChildAppender(writeStringTextNode)
  }, makeStructureNS(
    GX_NAMESPACE_URIS, {
      'x': makeChildAppender(writeDecimalTextNode),
      'y': makeChildAppender(writeDecimalTextNode),
      'w': makeChildAppender(writeDecimalTextNode),
      'h': makeChildAppender(writeDecimalTextNode)
    }));


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const GX_NODE_FACTORY = function(value, objectStack, opt_nodeName) {
  return createElementNS(GX_NAMESPACE_URIS[0],
    'gx:' + opt_nodeName);
};


/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeIcon(node, icon, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const parentNode = objectStack[objectStack.length - 1].node;
  let orderedKeys = ICON_SEQUENCE[parentNode.namespaceURI];
  let values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(context,
    ICON_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
  orderedKeys =
      ICON_SEQUENCE[GX_NAMESPACE_URIS[0]];
  values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(context, ICON_SERIALIZERS,
    GX_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const ICON_STYLE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'scale', 'heading', 'Icon', 'hotSpot'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const ICON_STYLE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Icon': makeChildAppender(writeIcon),
    'heading': makeChildAppender(writeDecimalTextNode),
    'hotSpot': makeChildAppender(writeVec2),
    'scale': makeChildAppender(writeScaleTextNode)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/style/Icon} style Icon style.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeIconStyle(node, style, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const properties = {};
  const src = style.getSrc();
  const size = style.getSize();
  const iconImageSize = style.getImageSize();
  const iconProperties = {
    'href': src
  };

  if (size) {
    iconProperties['w'] = size[0];
    iconProperties['h'] = size[1];
    const anchor = style.getAnchor(); // top-left
    const origin = style.getOrigin(); // top-left

    if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
      iconProperties['x'] = origin[0];
      iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
    }

    if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
      const /** @type {module:ol/format/KML~Vec2} */ hotSpot = {
        x: anchor[0],
        xunits: IconAnchorUnits.PIXELS,
        y: size[1] - anchor[1],
        yunits: IconAnchorUnits.PIXELS
      };
      properties['hotSpot'] = hotSpot;
    }
  }

  properties['Icon'] = iconProperties;

  const scale = style.getScale();
  if (scale !== 1) {
    properties['scale'] = scale;
  }

  const rotation = style.getRotation();
  if (rotation !== 0) {
    properties['heading'] = rotation; // 0-360
  }

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = ICON_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, ICON_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const LABEL_STYLE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'color', 'scale'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const LABEL_STYLE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'scale': makeChildAppender(writeScaleTextNode)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/style/Text} style style.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeLabelStyle(node, style, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const properties = {};
  const fill = style.getFill();
  if (fill) {
    properties['color'] = fill.getColor();
  }
  const scale = style.getScale();
  if (scale && scale !== 1) {
    properties['scale'] = scale;
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys =
      LABEL_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, LABEL_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const LINE_STYLE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'color', 'width'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const LINE_STYLE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'width': makeChildAppender(writeDecimalTextNode)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/style/Stroke} style style.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeLineStyle(node, style, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const properties = {
    'color': style.getColor(),
    'width': style.getWidth()
  };
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = LINE_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, LINE_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @const
 * @type {Object.<string, string>}
 */
const GEOMETRY_TYPE_TO_NODENAME = {
  'Point': 'Point',
  'LineString': 'LineString',
  'LinearRing': 'LinearRing',
  'Polygon': 'Polygon',
  'MultiPoint': 'MultiGeometry',
  'MultiLineString': 'MultiGeometry',
  'MultiPolygon': 'MultiGeometry',
  'GeometryCollection': 'MultiGeometry'
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const GEOMETRY_NODE_FACTORY = function(value, objectStack, opt_nodeName) {
  if (value) {
    const parentNode = objectStack[objectStack.length - 1].node;
    return createElementNS(parentNode.namespaceURI,
      GEOMETRY_TYPE_TO_NODENAME[/** @type {module:ol/geom/Geometry} */ (value).getType()]);
  }
};


/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const POINT_NODE_FACTORY = makeSimpleNodeFactory('Point');


/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const LINE_STRING_NODE_FACTORY = makeSimpleNodeFactory('LineString');


/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const LINEAR_RING_NODE_FACTORY = makeSimpleNodeFactory('LinearRing');


/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const POLYGON_NODE_FACTORY = makeSimpleNodeFactory('Polygon');


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const MULTI_GEOMETRY_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LineString': makeChildAppender(
      writePrimitiveGeometry),
    'Point': makeChildAppender(
      writePrimitiveGeometry),
    'Polygon': makeChildAppender(writePolygon),
    'GeometryCollection': makeChildAppender(
      writeMultiGeometry)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeMultiGeometry(node, geometry, objectStack) {
  /** @type {module:ol/xml~NodeStackItem} */
  const context = {node: node};
  const type = geometry.getType();
  /** @type {Array.<module:ol/geom/Geometry>} */
  let geometries;
  /** @type {function(*, Array.<*>, string=): (Node|undefined)} */
  let factory;
  if (type == GeometryType.GEOMETRY_COLLECTION) {
    geometries = /** @type {module:ol/geom/GeometryCollection} */ (geometry).getGeometries();
    factory = GEOMETRY_NODE_FACTORY;
  } else if (type == GeometryType.MULTI_POINT) {
    geometries = /** @type {module:ol/geom/MultiPoint} */ (geometry).getPoints();
    factory = POINT_NODE_FACTORY;
  } else if (type == GeometryType.MULTI_LINE_STRING) {
    geometries =
        (/** @type {module:ol/geom/MultiLineString} */ (geometry)).getLineStrings();
    factory = LINE_STRING_NODE_FACTORY;
  } else if (type == GeometryType.MULTI_POLYGON) {
    geometries =
        (/** @type {module:ol/geom/MultiPolygon} */ (geometry)).getPolygons();
    factory = POLYGON_NODE_FACTORY;
  } else {
    assert(false, 39); // Unknown geometry type
  }
  pushSerializeAndPop(context,
    MULTI_GEOMETRY_SERIALIZERS, factory,
    geometries, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const BOUNDARY_IS_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LinearRing': makeChildAppender(
      writePrimitiveGeometry)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/geom/LinearRing} linearRing Linear ring.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeBoundaryIs(node, linearRing, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context,
    BOUNDARY_IS_SERIALIZERS,
    LINEAR_RING_NODE_FACTORY, [linearRing], objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const PLACEMARK_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ExtendedData': makeChildAppender(writeExtendedData),
    'MultiGeometry': makeChildAppender(writeMultiGeometry),
    'LineString': makeChildAppender(writePrimitiveGeometry),
    'LinearRing': makeChildAppender(writePrimitiveGeometry),
    'Point': makeChildAppender(writePrimitiveGeometry),
    'Polygon': makeChildAppender(writePolygon),
    'Style': makeChildAppender(writeStyle),
    'address': makeChildAppender(writeStringTextNode),
    'description': makeChildAppender(writeStringTextNode),
    'name': makeChildAppender(writeStringTextNode),
    'open': makeChildAppender(writeBooleanTextNode),
    'phoneNumber': makeChildAppender(writeStringTextNode),
    'styleUrl': makeChildAppender(writeStringTextNode),
    'visibility': makeChildAppender(writeBooleanTextNode)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const PLACEMARK_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
    'styleUrl', 'Style'
  ]);


/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 */
const EXTENDEDDATA_NODE_FACTORY = makeSimpleNodeFactory('ExtendedData');


/**
 * FIXME currently we do serialize arbitrary/custom feature properties
 * (ExtendedData).
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @this {module:ol/format/KML}
 */
function writePlacemark(node, feature, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};

  // set id
  if (feature.getId()) {
    node.setAttribute('id', feature.getId());
  }

  // serialize properties (properties unknown to KML are not serialized)
  const properties = feature.getProperties();

  // don't export these to ExtendedData
  const filter = {'address': 1, 'description': 1, 'name': 1, 'open': 1,
    'phoneNumber': 1, 'styleUrl': 1, 'visibility': 1};
  filter[feature.getGeometryName()] = 1;
  const keys = Object.keys(properties || {}).sort().filter(function(v) {
    return !filter[v];
  });

  if (keys.length > 0) {
    const sequence = makeSequence(properties, keys);
    const namesAndValues = {names: keys, values: sequence};
    pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
      EXTENDEDDATA_NODE_FACTORY, [namesAndValues], objectStack);
  }

  const styleFunction = feature.getStyleFunction();
  if (styleFunction) {
    // FIXME the styles returned by the style function are supposed to be
    // resolution-independent here
    const styles = styleFunction(feature, 0);
    if (styles) {
      const style = Array.isArray(styles) ? styles[0] : styles;
      if (this.writeStyles_) {
        properties['Style'] = style;
      }
      const textStyle = style.getText();
      if (textStyle) {
        properties['name'] = textStyle.getText();
      }
    }
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = PLACEMARK_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

  // serialize geometry
  const options = /** @type {module:ol/format/Feature~WriteOptions} */ (objectStack[0]);
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = transformWithOptions(geometry, true, options);
  }
  pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
    GEOMETRY_NODE_FACTORY, [geometry], objectStack);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const PRIMITIVE_GEOMETRY_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'extrude', 'tessellate', 'altitudeMode', 'coordinates'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const PRIMITIVE_GEOMETRY_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'extrude': makeChildAppender(writeBooleanTextNode),
    'tessellate': makeChildAppender(writeBooleanTextNode),
    'altitudeMode': makeChildAppender(writeStringTextNode),
    'coordinates': makeChildAppender(writeCoordinatesTextNode)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/geom/SimpleGeometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 */
function writePrimitiveGeometry(node, geometry, objectStack) {
  const flatCoordinates = geometry.getFlatCoordinates();
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  const properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, PRIMITIVE_GEOMETRY_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const POLYGON_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'outerBoundaryIs': makeChildAppender(
      writeBoundaryIs),
    'innerBoundaryIs': makeChildAppender(
      writeBoundaryIs)
  });


/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const INNER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('innerBoundaryIs');


/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const OUTER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('outerBoundaryIs');


/**
 * @param {Node} node Node.
 * @param {module:ol/geom/Polygon} polygon Polygon.
 * @param {Array.<*>} objectStack Object stack.
 */
function writePolygon(node, polygon, objectStack) {
  const linearRings = polygon.getLinearRings();
  const outerRing = linearRings.shift();
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  // inner rings
  pushSerializeAndPop(context,
    POLYGON_SERIALIZERS,
    INNER_BOUNDARY_NODE_FACTORY,
    linearRings, objectStack);
  // outer ring
  pushSerializeAndPop(context,
    POLYGON_SERIALIZERS,
    OUTER_BOUNDARY_NODE_FACTORY,
    [outerRing], objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const POLY_STYLE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode)
  });


/**
 * A factory for creating coordinates nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const COLOR_NODE_FACTORY = makeSimpleNodeFactory('color');


/**
 * @param {Node} node Node.
 * @param {module:ol/style/Fill} style Style.
 * @param {Array.<*>} objectStack Object stack.
 */
function writePolyStyle(node, style, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context, POLY_STYLE_SERIALIZERS,
    COLOR_NODE_FACTORY, [style.getColor()], objectStack);
}


/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 */
function writeScaleTextNode(node, scale) {
  // the Math is to remove any excess decimals created by float arithmetic
  writeDecimalTextNode(node,
    Math.round(scale * 1e6) / 1e6);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const STYLE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const STYLE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'IconStyle': makeChildAppender(writeIconStyle),
    'LabelStyle': makeChildAppender(writeLabelStyle),
    'LineStyle': makeChildAppender(writeLineStyle),
    'PolyStyle': makeChildAppender(writePolyStyle)
  });


/**
 * @param {Node} node Node.
 * @param {module:ol/style/Style} style Style.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeStyle(node, style, objectStack) {
  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: node};
  const properties = {};
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  const imageStyle = style.getImage();
  const textStyle = style.getText();
  if (imageStyle instanceof Icon) {
    properties['IconStyle'] = imageStyle;
  }
  if (textStyle) {
    properties['LabelStyle'] = textStyle;
  }
  if (strokeStyle) {
    properties['LineStyle'] = strokeStyle;
  }
  if (fillStyle) {
    properties['PolyStyle'] = fillStyle;
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node to append a TextNode with the Vec2 to.
 * @param {module:ol/format/KML~Vec2} vec2 Vec2.
 */
function writeVec2(node, vec2) {
  node.setAttribute('x', vec2.x);
  node.setAttribute('y', vec2.y);
  node.setAttribute('xunits', vec2.xunits);
  node.setAttribute('yunits', vec2.yunits);
}


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const KML_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'Document', 'Placemark'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const KML_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Document': makeChildAppender(writeDocument),
    'Placemark': makeChildAppender(writePlacemark)
  });


/**
 * Encode an array of features in the KML format. GeometryCollections, MultiPoints,
 * MultiLineStrings, and MultiPolygons are output as MultiGeometries.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {string} Result.
 * @api
 */
KML.prototype.writeFeatures;


/**
 * Encode an array of features in the KML format as an XML node. GeometryCollections,
 * MultiPoints, MultiLineStrings, and MultiPolygons are output as MultiGeometries.
 *
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
KML.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const kml = createElementNS(NAMESPACE_URIS[4], 'kml');
  const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  kml.setAttributeNS(xmlnsUri, 'xmlns:gx', GX_NAMESPACE_URIS[0]);
  kml.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
  kml.setAttributeNS(XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', SCHEMA_LOCATION);

  const /** @type {module:ol/xml~NodeStackItem} */ context = {node: kml};
  const properties = {};
  if (features.length > 1) {
    properties['Document'] = features;
  } else if (features.length == 1) {
    properties['Placemark'] = features[0];
  }
  const orderedKeys = KML_SEQUENCE[kml.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys,
    this);
  return kml;
};

export default KML;
