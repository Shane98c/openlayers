goog.provide('ol.test.Projection');

describe('ol.Projection', function() {

  beforeEach(function() {
    spyOn(ol.Projection, 'addTransform').andCallThrough();
  });

  afterEach(function() {
    var argsForCall = ol.Projection.addTransform.argsForCall;
    for (var i = 0, ii = argsForCall.length; i < ii; ++i) {
      try {
        ol.Projection.removeTransform.apply(
            ol.Projection, argsForCall[i].splice(0, 2));
      } catch (error) {
        if (error instanceof goog.asserts.AssertionError) {
          // The removeTransform function may have been called explicitly by the
          // tests, so we pass.
        } else {
          throw error;
        }
      }
    }
  });

  describe('projection equivalence', function() {

    function _testAllEquivalent(codes) {
      var projections = goog.array.map(codes, ol.Projection.getFromCode);
      goog.array.forEach(projections, function(source) {
        goog.array.forEach(projections, function(destination) {
          expect(ol.Projection.equivalent(source, destination)).toBeTruthy();
        });
      });
    }

    it('gives that 3857, 102100, 102113, 900913 are equivalent ', function() {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:102100',
        'EPSG:102113',
        'EPSG:900913'
      ]);
    });

    it('gives that CRS:84, urn:ogc:def:crs:EPSG:6.6:4326, EPSG:4326 are ' +
       'equivalent', function() {
          _testAllEquivalent([
            'CRS:84',
            'urn:ogc:def:crs:EPSG:6.6:4326',
            'EPSG:4326'
          ]);
        });
  });

  describe('identify transform', function() {

    it('returns a new object, with same coord values', function() {
      var epsg4326 = ol.Projection.getFromCode('EPSG:4326');
      var uniqueObject = {};
      var sourcePoint = new ol.Coordinate(uniqueObject, uniqueObject);
      var destinationPoint = ol.Projection.transform(
          sourcePoint, epsg4326, epsg4326);
      expect(sourcePoint === destinationPoint).toBeFalsy();
      expect(destinationPoint.x === sourcePoint.x).toBeTruthy();
      expect(destinationPoint.y === sourcePoint.y).toBeTruthy();
    });
  });

  describe('transform 0,0 from 4326 to 3857', function() {

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(0, 0), 'EPSG:4326', 'EPSG:3857');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.y).toRoughlyEqual(0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', function() {

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(0, 0), 'EPSG:3857', 'EPSG:4326');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toEqual(0);
      expect(point.y).toEqual(0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(-5.625, 52.4827802220782),
          'EPSG:4326',
          'EPSG:900913');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toRoughlyEqual(-626172.13571216376, 1e-9);
      expect(point.y).toRoughlyEqual(6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(-626172.13571216376, 6887893.4928337997),
          'EPSG:900913',
          'EPSG:4326');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toRoughlyEqual(-5.625, 1e-9);
      expect(point.y).toRoughlyEqual(52.4827802220782, 1e-9);
    });
  });

  describe('Proj4js integration', function() {

    it('allows Proj4js projections to be used transparently', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(-626172.13571216376, 6887893.4928337997),
          'GOOGLE',
          'WGS84');
      expect(point.x).toRoughlyEqual(-5.625, 1e-9);
      expect(point.y).toRoughlyEqual(52.4827802220782, 1e-9);
    });

    it('allows new Proj4js projections to be defined', function() {
      Proj4js.defs['EPSG:21781'] =
          '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(7.439583333333333, 46.95240555555556),
          'EPSG:4326',
          'EPSG:21781');
      expect(point.x).toRoughlyEqual(600072.300, 1);
      expect(point.y).toRoughlyEqual(200146.976, 1);
    });

  });

  describe('ol.Projection.getTransform()', function() {

    var sm = ol.Projection.getFromCode('GOOGLE');
    var gg = ol.Projection.getFromCode('EPSG:4326');

    it('returns a transform function', function() {
      var transform = ol.Projection.getTransform(sm, gg);
      expect(typeof transform).toBe('function');

      var coordinate = transform(new ol.Coordinate(-12000000, 5000000));

      expect(coordinate.x).toRoughlyEqual(-107.79783409434258, 1e-9);
      expect(coordinate.y).toRoughlyEqual(40.91627447067577, 1e-9);
    });

  });


  describe('ol.Projection.getTransformFromCodes()', function() {

    it('returns a function', function() {
      var transform = ol.Projection.getTransformFromCodes(
          'GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');
    });

    it('returns a transform function', function() {
      var transform = ol.Projection.getTransformFromCodes(
          'GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');

      var coordinate = transform(
          new ol.Coordinate(-626172.13571216376, 6887893.4928337997));

      expect(coordinate.x).toRoughlyEqual(-5.625, 1e-9);
      expect(coordinate.y).toRoughlyEqual(52.4827802220782, 1e-9);

    });

  });

  describe('ol.Projection.removeTransform()', function() {

    var extent = new ol.Extent(-180, -90, 180, 90);
    var units = ol.ProjectionUnits.DEGREES;

    it('removes functions cached by addTransform', function() {
      var foo = new ol.Projection('foo', units, extent);
      var bar = new ol.Projection('bar', units, extent);
      var transform = function() {};
      ol.Projection.addTransform(foo, bar, transform);
      expect(ol.Projection.transforms_).not.toBeUndefined();
      expect(ol.Projection.transforms_.foo).not.toBeUndefined();
      expect(ol.Projection.transforms_.foo.bar).toBe(transform);

      var removed = ol.Projection.removeTransform(foo, bar);
      expect(removed).toBe(transform);
      expect(ol.Projection.transforms_.foo).toBeUndefined();
    });

  });

});

goog.require('goog.array');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
