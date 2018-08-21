(function(exports){

var RE_IDENTIFIER = new RegExp(
    '(?:'+                                           // begin OR group
      '(?:arXiv:)(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+   // there is a new-form arxiv id
        '|'+                                             // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+   // old-form id (not allowed by S2)
        '|'+
      '(?:^(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)$)'+   // new-form with no preamble
    ')'                                              // end OR group
);

var RE_ARXIVID_URL = new RegExp(
    '^http(?:s)?://(?:.*\.)?arxiv.org/abs/'+             // we are on an abs page
    '(?:'+                                           // begin OR group
      '(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+       // there is a new-form arxiv id
        '|'+                                            // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+ // old-form id (not allowed by S2)
    ')'+                                             // end OR group
    '(?:#.*)?'+                                 // anchor links on page
    '(?:\\?.*)?$'                               // query parameter stuff
);

var RE_CATEGORY_FULL = new RegExp(/\(([a-z\-]+(:?\.[a-zA-Z\-]+)?)\)/g);
var RE_CATEGORY_MAJOR = new RegExp(/([a-z\-]+)(:?\.[a-zA-Z\-]+)?/g);

function random_id(){
    return String(Math.random()).substring(2,12);
}

function allmatches(string, regex, index){
    var matches = [];
    var match = regex.exec(string);
    while (match !== null){
        matches.push(match[index]);
        match = regex.exec(string);
    }
    return matches;
}

//=============================================================
// category extraction methods
function minor_to_major(category){
    // extract the major category from a full minor category
    var match = allmatches(category, RE_CATEGORY_MAJOR, 1);
    return match ? match[0] : '';
}

function get_minor_categories_primary(){
    var txt = $('.primary-subject').text();
    return allmatches(txt, RE_CATEGORY_FULL, 1);
}

function get_minor_categories_all(){
    // find the entries in the table which look like
    // (cat.MIN) -> (cs.DL, math.AS, astro-ph.GD)
    // also, (hep-th)
    var txt = $('.metatable').find('.subjects').text();
    return allmatches(txt, RE_CATEGORY_FULL, 1);
}

function get_minor_categories(){
    return get_minor_categories_primary() || get_minor_categories_all();
}

function get_categories(){
    var cats = get_minor_categories();

    var out = [];
    for (var i=0; i<cats.length; i++)
        out.push([minor_to_major(cats[i]), cats[i]]);
    return out;
}

//=============================================================
// article id extraction functions
function get_current_article_url(){
    var url = $(location).attr('href');
    var match = RE_ARXIVID_URL.exec(url);

    if (!match){
        console.log("No valid match could be found for article ID");
        return;
    }

    var aid = match.filter(function(x){return x;}).pop();

    if (aid.length <= 5){
        console.log("No valid article ID extracted from the browser location.");
        return;
    }

    return aid;
}

function get_current_article_meta(){
    // FIXME -- directly references abs element
    var obj = $('[name="citation_arxiv_id"]');
    return obj ? obj.attr('content') : null;
}

function get_current_article(){
    return get_current_article_meta() || get_current_article_url();
}

//=============================================================
// article id extraction functions
function asset_url(url){
    var output = '';
    try {
        output = chrome.extension.getURL(bib_config.EXTENSION_ASSET_BASE + url);
    } catch (err) {
        output = bib_config.URL_ASSET_BASE + url;
    }
    return output;
}

function encodeQueryData(data) {
    var ret = [];
    for (var d in data){
        key = d;
        val = data[d];

        if (!Array.isArray(val))
            val = [val];

        for (var i=0; i<val.length; i++)
            ret.push(
                encodeURIComponent(key) + '=' +
                encodeURIComponent(val[i])
            );
    }
    return ret.join('&');
}

function urlproxy(url){
    if (bib_config.URL_PROXY)
        return bib_config.URL_PROXY + '?url=' + encodeURIComponent(url);
    return url;
}

function tolastname(ref){
    if (typeof ref === 'undefined')
        return '';

    var name = ref.name || '';
    var parts = name.split(' ');
    return parts[parts.length-1];
}

Array.prototype.remove = function(element){
    var index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
};

exports.RE_IDENTIFIER = RE_IDENTIFIER;

exports.get_categories = get_categories;
exports.get_current_article = get_current_article;

exports.random_id = random_id;
exports.encodeQueryData = encodeQueryData;
exports.urlproxy = urlproxy;
exports.asset_url = asset_url;
exports.tolastname = tolastname;

}(typeof exports === 'undefined' ? this.bib_lib = {} : exports));
