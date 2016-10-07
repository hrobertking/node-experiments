/**
 * @author: hrobertking@cathmhoal.com
 *
 * @exports domain as domain
 * @exports range as range
 * @exports scale as scale
 *
 */

var domain = [0, 1]
  , range = [0, 1]
  , modifier
;

/**
 * The minimum and maximum values of unscaled numbers
 *
 * @type     {number[]}
 */
Object.defineProperty(exports, 'domain', {
  get: function() {
    return domain;
  },
  set: function(nums) {
    if (nums && nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
      domain[0] = parseFloat(nums[0]);
      domain[1] = parseFloat(nums[1]);
    }
  }
});

/**
 * The minimum and maximum values for scaled numbers
 *
 * @type     {number[]}
 */
Object.defineProperty(exports, 'range', {
  get: function() {
    return range;
  },
  set: function(nums) {
    if (nums && nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
      range[0] = parseFloat(nums[0]);
      range[1] = parseFloat(nums[1]);
    }
  }
});

/**
 * Creates a scaling object
 *
 * @return  {number}
 *
 * @param  {number} value
 */
function scale(value) {
  if (value && !isNaN(value) && domain.length > 1 && domain[0] !== domain[1]) {
    if (value === domain[0]) {
      /* If the value being scaled is the minimum value, */
      /* return the minimum range                        */
      value = range[0];
    } else if (value === domain[1]) {
      /* If the value being scaled is the maximum value, */
      /* return the maximum range                        */
      value = range[1];
    } else {
      /* Calculate the scaled value as a percentage of   */
      /* the total range available                       */
      value = ((range[1] - range[0]) *
               ((value - domain[0]) /
                ((domain[1] - domain[0]) || 1)));
      /* Add the minimum range value to adjust           */
      value += range[0];
    }
  }
  return value;
}
exports.scale = scale;
