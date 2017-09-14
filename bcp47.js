/**
 * @author hrobertking@cathmhaol.com
 * @module bcp47
 * @description Parses and validates a bcp47 language code
 */

const iso6391 = ['aa','am','ar','ha','he','mt','om','so','ti','cr','oj','km','vi','ch','fj','ho','id','jv','mg','ms','mi','mh','na','sm','su','tl','to','ty','ay','eo','ia','ie','io','vo','bi','ht','sg','nv','kn','ml','ta','te','ik','iu','kl','af','sq','an','hy','as','ae','be','bn','bh','bs','br','bg','ca','kw','co','hr','cs','da','dv','nl','en','fo','fr','gl','de','el','gu','hi','ga','is','it','ks','ku','la','lb','li','lt','lv','gv','mk','mr','ne','nb','nn','no','oc','cu','or','os','pa','pi','fa','pl','ps','pt','rm','ro','ru','sa','sc','sd','sr','gd','si','sk','sl','es','sv','tg','uk','ur','wa','cy','fy','yi','ja','ko','eu','mn','ak','bm','ny','ee','ff','hz','ig','ki','rw','kg','kj','lg','ln','lu','nd','ng','nr','rn','sn','st','sw','ss','tn','ts','tw','ve','wo','xh','yo','zu','kr','av','ce','ab','qu','my','zh','dz','ii','bo','ka','lo','th','za','gn','az','ba','cv','kk','ky','tk','tr','tt','ug','uz','et','fi','hu','kv','se'];
const iso6392T = ['aar','abk','ave','afr','aka','amh','arg','ara','asm','ava','aym','aze','bak','bel','bul','bih','bis','bam','ben','bod','bre','bos','cat','che','cha','cos','cre','ces','chu','chv','cym','dan','deu','div','dzo','ewe','ell','eng','epo','spa','est','eus','fas','ful','fin','fij','fao','fra','fry','gle','gla','glg','grn','guj','glv','hau','heb','hin','hmo','hrv','hat','hun','hye','her','ina','ind','ile','ibo','iii','ipk','ido','isl','ita','iku','jpn','jav','kat','kon','kik','kua','kaz','kal','khm','kan','kor','kau','kas','kur','kom','cor','kir','lat','ltz','lug','lim','lin','lao','lit','lub','lav','mlg','mah','mri','mkd','mal','mon','mar','msa','mlt','mya','nau','nob','nde','nep','ndo','nld','nno','nor','nbl','nav','nya','oci','oji','orm','ori','oss','pan','pli','pol','pus','por','que','roh','run','ron','rus','kin','san','srd','snd','sme','sag','sin','slk','slv','smo','sna','som','sqi','srp','ssw','sot','sun','swe','swa','tam','tel','tgk','tha','tir','tuk','tgl','tsn','ton','tur','tso','tat','twi','tah','uig','ukr','urd','uzb','ven','vie','vol','wln','wol','xho','yid','yor','zha','zho','zul'];
const iso31661 = ['AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MK','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SZ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU','VE','VN','VG','VI','WF','EH','YE','ZM','ZW'];

/**
 * @property LANGUAGE_CODES
 * @description Two-character language codes
 * @type {string[]}
 */
Object.defineProperty(exports, 'LANGUAGE_CODES', {
  get: function() {
    return iso6391;
  },
};

/**
 * @property LANGUAGE_CODES_EXTENDED
 * @description Three-character language codes
 * @type {string[]}
 */
Object.defineProperty(exports, 'LANGUAGE_CODES', {
  get: function() {
    return iso6392T;
  },
};

/**
 * @property COUNTRY_CODES
 * @description Two-character country codes
 * @type {string[]}
 */
Object.defineProperty(exports, 'COUNTRY_CODES', {
  get: function() {
    return iso31661;
  },
};

/**
 * @method parse
 * @description Parses the provided locale and returns an object with a valid country and language.
 * A valid BCP 47 lang code must have an ISO 639 language code present even if the other portions
 * of the code, e.g., the country, are not present. A locale is considered 'validated' when a valid
 * language is present and the country is either undefined or matches a known country code.
 *
 * @returns {object}
 * @param {string} locale - BCP 47 lang code
 * @throws {TypeError} Invalid BCP 47 code if the provided language code cannot be found
 * @throws {TypeError} Missing BCP 47 code if the language code is not provided
 * @see {@link http://www.ietf.org/rfc/rfc3066.txt|RFC 3066}
 */
exports.parse = (locale) => {
  let [ inputString, langCode, countryCode ] = /([a-z]{2,3})[^a-z]?([a-z0-9]{2,8})?/i.exec(locale);

  /* validate the language code when it's the two letter code */
  if (langCode && (
      (langCode.length < 3 && iso6391.indexOf(langCode) < 0) || 
      (langCode.length < 3 && iso6391.indexOf(langCode) < 0)
      )) {
    throw new TypeError('Invalid BCP 47 code', 'bcp47.js', 41);
  } else if (!langCode) {
    throw new TypeError('Missing BCP 47 code', 'bcp47.js', 43);
  }

  /* validate the country code */
  if (countryCode && countryCode.length < 3 && iso31661.indexOf(countryCode) < 0) {
    countryCode = undefined;
  }

  /* consider codes validated if we have a valid language and the country is either undefined
   * or matches a known country code */
  validated = (iso6391.indexOf(langCode) > -1) && 
    (!countryCode || iso31661.indexOf(countryCode) > -1);

  return { country: countryCode, language: langCode, validated };
};
