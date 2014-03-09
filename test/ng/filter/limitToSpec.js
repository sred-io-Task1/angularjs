'use strict';

describe('Filter: limitTo', function() {
  var items;
  var str
  var limitTo;

  beforeEach(inject(function($filter) {
    items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    str = "tuvwxyz";
    limitTo = $filter('limitTo');
  }));


  it('should return the first X items when X is positive', function() {
    expect(limitTo(items, 3)).toEqual(['a', 'b', 'c']);
    expect(limitTo(items, '3')).toEqual(['a', 'b', 'c']);
    expect(limitTo(str, 3)).toEqual("tuv");
    expect(limitTo(str, '3')).toEqual("tuv");
  });

  it('should return the first X items beginning from index Y when X and Y are positive', function() {
    expect(limitTo(items, 3, '3')).toEqual(['d', 'e', 'f']);
    expect(limitTo(items, '3', 3)).toEqual(['d', 'e', 'f']);
    expect(limitTo(str, 3, 3)).toEqual("wxy");
    expect(limitTo(str, '3', '3')).toEqual("wxy");
  });

  it('should return the first X items beginning from index Y when X is positive and Y is negative', function() {
    expect(limitTo(items, 3, '-3')).toEqual(['f', 'g', 'h']);
    expect(limitTo(items, '3', -3)).toEqual(['f', 'g', 'h']);
    expect(limitTo(str, 3, -3)).toEqual("xyz");
    expect(limitTo(str, '3', '-3')).toEqual("xyz");
  });

  it('should return the last X items when X is negative', function() {
    expect(limitTo(items, -3)).toEqual(['f', 'g', 'h']);
    expect(limitTo(items, '-3')).toEqual(['f', 'g', 'h']);
    expect(limitTo(str, -3)).toEqual("xyz");
    expect(limitTo(str, '-3')).toEqual("xyz");
  });

  it('should return the last X items until index Y when X and Y are negative', function() {
    expect(limitTo(items, -3, '-3')).toEqual(['c', 'd', 'e']);
    expect(limitTo(items, '-3', -3)).toEqual(['c', 'd', 'e']);
    expect(limitTo(str, -3, -3)).toEqual("uvw");
    expect(limitTo(str, '-3', '-3')).toEqual("uvw");
  });

  it('should return the last X items until index Y when X is negative and Y is positive', function() {
    expect(limitTo(items, -3, '4')).toEqual(['b', 'c', 'd']);
    expect(limitTo(items, '-3', 4)).toEqual(['b', 'c', 'd']);
    expect(limitTo(str, -3, 4)).toEqual("uvw");
    expect(limitTo(str, '-3', '4')).toEqual("uvw");
  });

  it('should return an empty array when X cannot be parsed', function() {
    expect(limitTo(items, 'bogus')).toEqual([]);
    expect(limitTo(items, 'null')).toEqual([]);
    expect(limitTo(items, 'undefined')).toEqual([]);
    expect(limitTo(items, null)).toEqual([]);
    expect(limitTo(items, undefined)).toEqual([]);
  });

  it('should return an empty string when X cannot be parsed', function() {
    expect(limitTo(str, 'bogus')).toEqual("");
    expect(limitTo(str, 'null')).toEqual("");
    expect(limitTo(str, 'undefined')).toEqual("");
    expect(limitTo(str, null)).toEqual("");
    expect(limitTo(str, undefined)).toEqual("");
  });

  it('should take 0 as beginning index value when Y cannot be parsed', function() {
    expect(limitTo(items, 3, 'bogus')).toEqual(limitTo(items, 3, 0));
    expect(limitTo(items, -3, 'null')).toEqual(limitTo(items, -3));
    expect(limitTo(items, '3', 'undefined')).toEqual(limitTo(items, '3', 0));
    expect(limitTo(items, '-3', null)).toEqual(limitTo(items, '-3'));
    expect(limitTo(items, 3, undefined)).toEqual(limitTo(items, 3, 0));
    expect(limitTo(str, 3, 'bogus')).toEqual(limitTo(str, 3));
    expect(limitTo(str, -3, 'null')).toEqual(limitTo(str, -3, 0));
    expect(limitTo(str, '3', 'undefined')).toEqual(limitTo(str, '3'));
    expect(limitTo(str, '-3', null)).toEqual(limitTo(str, '-3', 0));
    expect(limitTo(str, 3, undefined)).toEqual(limitTo(str, 3));
  });


  it('should return input if not String or Array', function() {
    expect(limitTo(1,1)).toEqual(1);
    expect(limitTo(null, 1)).toEqual(null);
    expect(limitTo(undefined, 1)).toEqual(undefined);
    expect(limitTo({}, 1)).toEqual({});
  });


  it('should return a copy of input array if X is exceeds array length', function () {
    expect(limitTo(items, 9)).toEqual(items);
    expect(limitTo(items, '9')).toEqual(items);
    expect(limitTo(items, -9)).toEqual(items);
    expect(limitTo(items, '-9')).toEqual(items);

    expect(limitTo(items, 9)).not.toBe(items);
  });

  it('should return the entire string if X exceeds input length', function() {
    expect(limitTo(str, 9)).toEqual(str);
    expect(limitTo(str, '9')).toEqual(str);
    expect(limitTo(str, -9)).toEqual(str);
    expect(limitTo(str, '-9')).toEqual(str);
  });

  it('should return an empty array if Y exceeds input length', function() {
    expect(limitTo(items, '3', 12)).toEqual([]);
    expect(limitTo(items, 4, '-12')).toEqual([]);
    expect(limitTo(items, -3, '12')).toEqual([]);
    expect(limitTo(items, '-4', -12)).toEqual([]);
  });

  it('should return an empty string if Y exceeds input length', function() {
    expect(limitTo(str, '3', 12)).toEqual("");
    expect(limitTo(str, 4, '-12')).toEqual("");
    expect(limitTo(str, -3, '12')).toEqual("");
    expect(limitTo(str, '-4', -12)).toEqual("");
  });

  it('should return the entire string beginning from Y if X is positive and X+Y exceeds input length', function() {
    expect(limitTo(items, 7, 3)).toEqual(['d', 'e', 'f', 'g', 'h']);
    expect(limitTo(items, 7, -3)).toEqual(['f', 'g', 'h']);
    expect(limitTo(str, 6, 3)).toEqual("wxyz");
    expect(limitTo(str, 6, -3)).toEqual("xyz");
  });

  it('should return the entire string until index Y if X is negative and X+Y exceeds input length', function() {
    expect(limitTo(items, -7, 3)).toEqual(['a', 'b', 'c']);
    expect(limitTo(items, -7, -3)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(limitTo(str, -6, 3)).toEqual("tuv");
    expect(limitTo(str, -6, -3)).toEqual("tuvw");
  });
});
