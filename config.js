// Update Cycle
const UPDATE_CYCLE = 90; // 3 months
// ABN query related
const ABN_GUID = 'd81c0029-c14d-4e79-8123-b60fd442b6dc';
var urlABN = "https://abr.business.gov.au/abrxmlsearch/ABRXMLSearch.asmx/SearchByABNv202001";

// BING query related
const BING_API_KEY   = "4c8ad5f0c62d4921b5c31f7d049579de";
const CLIENT_ID_COOKIE = "d126bbed-8e4e-4a89-9cf8-3c461d034765";
const BING_NLP_API_KEY = '47c631fe89f44f9a9679d1a4509fa949';

// TAX GENII
const TAX_GENII_URI = "https://bsearchau.accziom.com:5053/";
const TAX_GENII_API_KEY = '10000a28-36fc-4eb3-babd-54ca609a0da3';

// ANSIC classification service
const ANZIC_AI_URL = 'http://localhost:5050';
const ANZIC_INFO_URL = 'https://bsearchau.accziom.com:8011';

const ANZIC_START_MESSAGE = 'Hello! Please input your business name.';
const ANZIC_MAX_CANDIDATE_CNT = 5;

// ANZOGRAPH query related
// user: admin
// pass: Passw0rd1
// port: 8180
const ANZOGRAPH_ENDPOINT = 'http://admin:Passw0rd1@localhost:8180/sparql';

// GBG Verification Service
const GBG_USERID = 'lodge';
const GBG_PASSWORD = 'b63-yqT-cg7-8XM';
const GBG_API_ENDPOINT = `https://${GBG_USERID}:${GBG_PASSWORD}@au.vixverify.com/vixbiz/api/v1/businessVerification`;
const GBG_INFO_ENDPOINT = `https://au.vixverify.com/vixbiz/api/v1/businessVerification`;

// ASIC and SENSIS related
// currently unused
// api key list
var urlASICSearchNNI = "https://www.gateway.uat.asic.gov.au:443/gateway/ExternalSearchNniNamePortV3";
const SENSIS_API_KEY = '68424n4eev5un6rce46rr67e';


module.exports = {
    UPDATE_CYCLE,
    ABN_GUID,
    urlABN,

    BING_API_KEY,
    CLIENT_ID_COOKIE,
    BING_NLP_API_KEY,

    ANZIC_AI_URL,
    ANZIC_INFO_URL,
    ANZIC_START_MESSAGE,
    ANZIC_MAX_CANDIDATE_CNT,

    ANZOGRAPH_ENDPOINT,

    GBG_USERID,
    GBG_PASSWORD,
    GBG_API_ENDPOINT,
    GBG_INFO_ENDPOINT,

    TAX_GENII_URI,
    TAX_GENII_API_KEY
}
