import { defineStore } from 'pinia'
import utilsNetwork from '@/lib/utils_network';


export const useConfigStore = defineStore('config', {
  state: () => ({

    versionMajor: 1,
    versionMinor: 2,
    versionPatch: 4,


    regionUrls: {

      dev:{

        ldpjs : 'http://localhost:9401/api-staging/',
        util  : 'http://localhost:9401/util/',
        // util  : 'http://localhost:5200/',
        utilLang: 'http://localhost:9401/util-lang/',
        scriptshifter: 'http://localhost:9401/scriptshifter/',
        publish : 'http://localhost:9401/util/publish/staging',
        validate: 'http://localhost:5200/validate',
        publishNar: 'http://localhost:9401/util/nacostub/staging',
        bfdb : 'https://preprod-8230.id.loc.gov/',
        shelfListing: 'https://preprod-8230.id.loc.gov/',
        profiles : 'http://localhost:9401/util/profiles/profile/prod',
        starting: 'http://localhost:9401/util/profiles/starting/prod',

        profiles: 'https://raw.githubusercontent.com/lcnetdev/bfe-profiles/main/profile-prod/data.json',
        // profiles: 'https://raw.githubusercontent.com/lcnetdev/bfe-profiles/main/profile-stage/data.json',
        starting: 'https://raw.githubusercontent.com/lcnetdev/bfe-profiles/main/starting-prod/data.json',

        id: 'https://id.loc.gov/',
        env : 'production',
        dev: true,
        displayLCOnlyFeatures: true,
        simpleLookupLang: 'en',
      },

      staging:{

        ldpjs : 'https://preprod-3001.id.loc.gov/bfe2/api-staging/',
        util  :  'https://preprod-3001.id.loc.gov/bfe2/util/',
        utilLang  :  'https://editor.id.loc.gov/bfe2/util-lang/',
        scriptshifter: 'https://preprod-3001.id.loc.gov/bfe2/scriptshifter/',
        publish: 'https://preprod-3001.id.loc.gov/bfe2/util/publish/staging',
        publishNar: 'https://preprod-3001.id.loc.gov/bfe2/util/nacostub/staging',
        validate: 'https://preprod-3001.id.loc.gov/bfe2/util/validate',
        shelfListing: 'https://preprod-8230.id.loc.gov/',
        // bfdb : 'https://preprod-8210.id.loc.gov/',
        bfdb : 'https://preprod-8300.id.loc.gov/',
        profiles : '/bfe2/util/profiles/profile/stage',
        // profiles : '/bfe2/util/profiles/profile/prod',
        // profiles: 'https://preprod-3001.id.loc.gov/api/listconfigs?where=index.resourceType:profile',
        starting : '/bfe2/util/profiles/starting/stage',
        id: 'https://preprod-8288.id.loc.gov/',
        env : 'staging',
        displayLCOnlyFeatures: true,
        simpleLookupLang: 'en',
      },

      production:{

        ldpjs : 'https://editor.id.loc.gov/bfe2/api-production/',
        util  :  'https://editor.id.loc.gov/bfe2/util/',
        utilLang  :  'https://editor.id.loc.gov/bfe2/util-lang/',
        scriptshifter  :  'https://editor.id.loc.gov/bfe2/scriptshifter/',
        publish: 'https://editor.id.loc.gov/bfe2/util/publish/production',
        publishNar: 'https://editor.id.loc.gov/bfe2/util/nacostub/production',
        shelfListing: 'https://preprod-8230.id.loc.gov/',
        validate: 'https://editor.id.loc.gov/bfe2/util/validate',
        bfdb : 'https://preprod-8230.id.loc.gov/',
        bfdbGPO : 'https://preprod-8210.id.loc.gov/',
        // profiles : 'https://editor.id.loc.gov/api/listconfigs?where=index.resourceType:profile',
        // starting : 'https://editor.id.loc.gov/api/listconfigs?where=index.resourceType:startingPoints&where=index.label:config',
        profiles : '/bfe2/util/profiles/profile/prod',
        starting : '/bfe2/util/profiles/starting/prod',

        id: 'https://preprod-8080.id.loc.gov/',
        env : 'production',
        displayLCOnlyFeatures: true,
        simpleLookupLang: 'en',
      },

      bibframeDotOrg:{

        ldpjs : 'https://bibframe.org/marva/api-production/',
        util  :  'https://bibframe.org/marva/util/',
        utilLang  :  'https://bibframe.org/marva/util-lang/',
        scriptshifter  :  'https://bibframe.org/scriptshifter/',
        publish: 'https://bibframe.org/marva/util/publish/production',
        validate: 'https://bibframe.org/marva/util/validate',
        bfdb : 'https://id.loc.gov/',
        profiles : 'https://bibframe.org/marva/util/profiles/profile/prod',
        starting : 'https://bibframe.org/marva/util/profiles/starting/prod',
        id: 'https://id.loc.gov/',
        env : 'production',
        publicEndpoints:true,
        displayLCOnlyFeatures: false,
        simpleLookupLang: 'en',
      }

    },



  postUsingAlmaXmlFormat: false,




  // used in the profile store, if the profle name ends with one of these it is a top level resource template
  validTopLevelProfileSufixes: [':Work',':Item',':Instance',':Hub'],
  validTopLevelWork: ':Work',
  validTopLevelItem: ':Item',
  validTopLevelInstance: ':Instance',
  validTopLevelHub: ':Hub',

  // the base URLS, used when building URIs for new resources
  baseURIWork: 'http://id.loc.gov/resources/works/',
  baseURIInstance: 'http://id.loc.gov/resources/instances/',
  baseURIItem: 'http://id.loc.gov/resources/items/',
  baseURIHub: 'http://id.loc.gov/resources/hubs/',


  // this value goes into the admin metadata to tell BFDB what type of action to take, this value is when a new work instance is being created
  procInfoNewWorkInstance: "create work",

  showUpdateAvailableModal:false,

  showNonLatinBulkModal: false,
  showNonLatinAgentModal: false,


  scriptshifterLanguages: {},


  profileHacks: {

    // UI display flags
    agentsHideManualRDFLabelIfURIProvided: {enabled:true,desc:"If the <agent> has a URI don't populate the manual label field, only if there is no URI in the node populate"},

    // Parsing the profile flags
    profileParseFixLowerCaseContribution: {enabled: true, desc:" someplaces lc:RT:bf2:Agents:Contribution is set to lc:RT:bf2:Agents:contribution (lowercase C) change it when lowercase to 'lc:RT:bf2:Agents:Contribution'"},

    profileParseFixPropertyURIWhenUpperCase: {enabled: true, desc:"Sometimes a class is used in the propertyURI field? /Role instead of /role for example, change them to camel case when not lowercase"},

    removeExtraFieldsInContributor: {enabled: true, desc:"Remove things like bflc:name00MatchKey bflc:primaryContributorName00MatchKey bflc:name00MarcKey fron contributor tags"},

  },

  // this is a list of properties that will be ignored in the literal language model box
  literalLangOptions:{
    ignorePtURIs: [
      'http://id.loc.gov/ontologies/bibframe/provisionActivity',
      'http://id.loc.gov/ontologies/bibframe/supplementaryContent',
      'http://id.loc.gov/ontologies/bibframe/subject',
      'http://id.loc.gov/ontologies/bflc/aap-normalized',
      'http://id.loc.gov/ontologies/bflc/aap',
      'http://id.loc.gov/ontologies/bibframe/shelfMark',
      'http://id.loc.gov/ontologies/bibframe/classification',
      'http://id.loc.gov/ontologies/bibframe/dimensions',
      'http://id.loc.gov/ontologies/bibframe/extent',
      'http://id.loc.gov/ontologies/bibframe/notation',
      ]
  },

  checkForRepeatedLiterals: [
    'http://id.loc.gov/ontologies/bibframe/mainTitle',
    'http://id.loc.gov/ontologies/bibframe/subtitle',
    'http://www.w3.org/2000/01/rdf-schema#label',
    'http://id.loc.gov/ontologies/bibframe/date',
  ],

  // these are the predicate fields that allow you to add another literal value
  // for the literals in the component if the proifle has literal-lang somewhere in it
  allowLiteralRepeatForNonRomain: [
    'http://id.loc.gov/ontologies/bibframe/title',
    'http://id.loc.gov/ontologies/bibframe/provisionActivity',
    'http://id.loc.gov/ontologies/bibframe/agent'

  ],

  checkForEDTFDatatype: [
    'http://id.loc.gov/ontologies/bibframe/date',
    'http://id.loc.gov/ontologies/bibframe/copyrightDate',
    'http://id.loc.gov/ontologies/bibframe/originDate',
    'http://id.loc.gov/ontologies/bflc/projectedProvisionDate',
  ],

  // these are predicates that will merged into one PT
  groupTopLeveLiterals: [
    'http://id.loc.gov/ontologies/bibframe/editionStatement',
    'http://id.loc.gov/ontologies/bibframe/responsibilityStatement',
  ],

  // these are properties that aren't allowed to be both when merging data with template
  templatesDataFlowCantBeBoth: [
    'id.loc.gov/ontologies/bibframe/adminMetadata',
  ],

  // these are not template-able properties
  templatesDataFlowHide: [
    'id.loc.gov/ontologies/bibframe/instanceOf',
    'http://id.loc.gov/ontologies/bibframe/hasInstance',
  ],


  // use the subject editor not the complex lookup modal when it has this propertyURI value
  useSubjectEditor: [
    'http://www.loc.gov/mads/rdf/v1#Topic',
    'http://www.loc.gov/mads/rdf/v1#componentList',
    'http://www.loc.gov/mads/rdf/v1#Geographic'
  ],

  // Do not enable deepHierarchy flags on these properties regardless of how complicated
  // deepHierarchy flag prevents editing extreamly nested structures since the editor is not designed
  // to allow editing of nested works for example
  exludeDeepHierarchy: [
    'http://id.loc.gov/ontologies/bibframe/adminMetadata',
    'http://id.loc.gov/ontologies/bibframe/subject'

  ],

  // if the field is using these properties we might want to enhance the interface with shelflisting tools
  lccFeatureProperties: [
    'http://id.loc.gov/ontologies/bibframe/itemPortion',
    'http://id.loc.gov/ontologies/bibframe/classificationPortion'

  ],

  excludeFromNonLatinLiteralCheck: [
    'http://id.loc.gov/ontologies/bibframe/subject',
    'http://id.loc.gov/ontologies/bibframe/contribution',
    'http://id.loc.gov/ontologies/bibframe/geographicCoverage'

  ],



  layouts: {
    all: {
      titles: {
        profileId: "Monograph",
        label: "Titles",
        properties: {
            "lc:RT:bf2:Monograph:Work": [
              "id_loc_gov_ontologies_bibframe_title__title_information"
            ],
            "lc:RT:bf2:Monograph:Instance": [
              "id_loc_gov_ontologies_bibframe_title__title_information"
            ]
        }
      },
      contributors: {
        profileId: "Monograph",
        label: "Contributors",
        properties: {
          "lc:RT:bf2:Monograph:Work": [
            "id_loc_gov_ontologies_bibframe_contribution__creator_of_work",
            "id_loc_gov_ontologies_bibframe_contribution__contributors"
          ]
        }
      },
      subjects: {
        profileId: "Monograph",
        label: "Subjects & Class",
        properties: {
          "lc:RT:bf2:Monograph:Work": [
            "id_loc_gov_ontologies_bibframe_subject__subjects",
            "id_loc_gov_ontologies_bibframe_classification__classification_numbers",
          ]
        }
      }

    }






  },







  // xml files stored in the static file directory
  testData:[
    {lccn:'2001059208',label:"The knitter's handy book of patterns: basic designs in multiple sizes & gauges", idUrl:'https://id.loc.gov/resources/instances/12618072.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},
    {lccn:'2021375840',label:"Schooling under control", idUrl:'https://id.loc.gov/resources/instances/21910923.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},
    {lccn:'2023920086',label:"The Serby saga (IBC)", idUrl:'https://id.loc.gov/resources/instances/23354934.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},
    {lccn:'2024398050',label:"Wehasŭ sonyŏn (Compilation)", idUrl:'https://id.loc.gov/resources/instances/23799873.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2018340701',label:"Qānūn al-ijrāʼāt al-jazāʼīyah", idUrl:'https://id.loc.gov/resources/instances/2018340701.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},



    {lccn:'2007052988',label:"A journey to the Western Islands of Scotland", idUrl:'https://id.loc.gov/resources/instances/15146892.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2023546355',label:"'P'osŭt'ŭ cheguk' ŭi Tong Asia", idUrl:'https://id.loc.gov/resources/instances/23591130.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2024019569',label:"The Routledge handbook of Christianity and culture", idUrl:'https://id.loc.gov/resources/instances/2024019569.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},


    {lccn:'2024038364',label:"White-tailed deer", idUrl:'https://id.loc.gov/resources/instances/23882742.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},





    {lccn:'2024591512',label:"The Berkshires, Massachusetts discovery map 2022-2023", idUrl:'https://id.loc.gov/resources/instances/23486403.html', profile:'Cartographic',profileId:'lc:RT:bf2:Cartographic:Instance'},
    {lccn:'2016627557',label:"Wallflower", idUrl:'https://id.loc.gov/resources/instances/2016627557.html', profile:'Audio CD',profileId:'lc:RT:bf2:SoundRecording:Instance'},
    {lccn:'2024623510',label:"Ein deutsches Requiem", idUrl:'https://id.loc.gov/resources/instances/23704895.html', profile:'Audio CD',profileId:'lc:RT:bf2:SoundRecording:Instance'},

    {lccn:'2023602524',label:"Bones and all", idUrl:'https://id.loc.gov/resources/instances/23150570.html', profile:'Moving Image: BluRay DVD',profileId:'lc:RT:bf2:MIBluRayDVD:Instance'},
    {lccn:'2005264032',label:"Business week", idUrl:'https://id.loc.gov/resources/instances/11138862.html', profile:'Serial',profileId:'lc:RT:bf2:Serial:Instance'},
    {lccn:'2011263182',label:"San Francisco chronicle", idUrl:'https://id.loc.gov/resources/instances/2011263182.html', profile:'Serial',profileId:'lc:RT:bf2:Serial:Instance'},


    {lccn:'2022442584',label:"test", idUrl:'https://id.loc.gov/resources/instances/2022442584.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2023537239',label:"test2", idUrl:'https://id.loc.gov/resources/instances/2023537239.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2023537239',label:"test2", idUrl:'https://id.loc.gov/resources/instances/2023537239.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},
    {lccn:'2023478592',label:"test3", idUrl:'https://id.loc.gov/resources/instances/2023478592.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2025363067',label:"test4", idUrl:'https://id.loc.gov/resources/instances/2025363067.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},


    {lccn:'2020467568',label:"Muliple Series Status Test", idUrl:'https://id.loc.gov/resources/instances/2020467568.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},

    {lccn:'2026888777',label:"Secondary Instance Test", idUrl:'https://id.loc.gov/resources/instances/2026888777.html', profile:'Monograph',profileId:'lc:RT:bf2:Monograph:Instance'},




  ],



  lookupConfig: {
    "http://id.loc.gov/authorities/childrensSubjects" : {
            "name":"childrensSubjects", "type":"complex", "modes":[
                {
                    'LCSHAC All':{"url":"https://id.loc.gov/authorities/childrensSubjects/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
                }
            ]
     },
     "http://id.loc.gov/bflists/intendedAudiences" : {
        "name":"intendedAudiences",
        "type":"complex",
        "processor" : 'lcAuthorities',
        "modes":[
            {
                'LCDGT':{"url":"https://id.loc.gov/authorities/demographicTerms/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all": true},
                'MARC':{"url":"https://id.loc.gov/vocabulary/maudience/suggest2/?q=<QUERY>&count=10&offset=<OFFSET>", "all": true}
            }
        ]
     },
    // "http://id.loc.gov/authorities/demographicTerms" : {"name":"demographicTerms", "type":"complex", "modes":[
    //   {
    //   'LCDGT All':{"url":"https://id.loc.gov/authorities/demographicTerms/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
    //   }
    // ]},
    "http://id.loc.gov/authorities/genreForms" : {
      "name":"genreForms",
      "type":"complex",
      "processor" : 'lcAuthorities',
      "modes":[
        {
          'LCGFT All':{"url":"https://id.loc.gov/authorities/genreForms/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true}
        }
      ]

    },

    "http://id.loc.gov/authorities/names" : {
      "name":"names",
      "type":"complex",
      "processor" : 'lcAuthorities',
      "modes":[
        {
          'NAF All':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
          'NAF Personal Names':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=PersonalName&count=25&offset=<OFFSET>"},
          'NAF Corporate Name':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=CorporateName&count=25&offset=<OFFSET>"},
          'NAF Name/Title':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=NameTitle&count=25&offset=<OFFSET>"},
          'NAF Title':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=Title&count=25&offset=<OFFSET>"},
          'NAF Geographic':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=Geographic&count=25&offset=<OFFSET>"},
          'NAF Conference Name':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=ConferenceName&count=25&offset=<OFFSET>"}
        }
      ]
    },

    "http://preprod.id.loc.gov/authorities/names" :{
      "name":"names",
      "type":"complex",
      "processor" : 'lcAuthorities',
      "modes":[
        {
          'NAF All':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>&searchtype=<TYPE>", "all":true},
          'NAF Personal Names':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=PersonalName&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Corporate Name':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=CorporateName&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Name/Title':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=NameTitle&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Title':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=Title&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Geographic':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=Geographic&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Conference Name':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=ConferenceName&count=25&offset=<OFFSET>&searchtype=<TYPE>"},

          'NAF Auth Names':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&memberOf=http://id.loc.gov/authorities/subjects/collection_NamesAuthorizedHeadings&count=25&offset=<OFFSET>&searchtype=<TYPE>"},
          'NAF Geo SubDiv':{"url":"http://preprod.id.loc.gov/authorities/names/suggest2/?q=<QUERY>&memberOf=http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions&count=25&offset=<OFFSET>&searchtype=<TYPE>"}
        }
      ]


    },


    "http://id.loc.gov/authorities/performanceMediums" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "All":{"url":"http://id.loc.gov/authorities/performanceMediums/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
      }
    ]},


    "http://id.loc.gov/authorities/subjects" : {
      "name":"subjects",
      "type":"complex",
      "processor" : 'lcAuthorities',

      "modes":[
        {
          'LCSH All':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
          'LCSH Topics':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=Topic&count=25&offset=<OFFSET>"},
          'LCSH Geographic':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=Geographic&count=25&offset=<OFFSET>"},
          'LCSH Name':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=Name&count=25&offset=<OFFSET>"},
          'LCSH FamilyName':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=FamilyName&count=25&offset=<OFFSET>"},
          'LCSH CorporateName':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=CorporateName&count=25&offset=<OFFSET>"},
          'LCSH GenreForm':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=GenreForm&count=25&offset=<OFFSET>"},
          'LCSH Simple Type':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=SimpleType&count=25&offset=<OFFSET>"},
          'LCSH Complex Subject':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=ComplexSubject&count=25&offset=<OFFSET>"},
          'LCSH Temporal':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=Temporal&count=25&offset=<OFFSET>"},

          'LCSH Auth Subjects':{"url":"http://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&memberOf=http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings&count=25&offset=<OFFSET>"},
          'LCSH SubDiv Subjects':{"url":"http://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&memberOf=http://id.loc.gov/authorities/subjects/collection_Subdivisions&count=25&offset=<OFFSET>"},
          'LCSH GnFrm Subjects':{"url":"http://id.loc.gov/authorities/genreForms/suggest2/?q=<QUERY>&memberOf=http://id.loc.gov/authorities/genreForms/collection_LCGFT_General&count=25&offset=<OFFSET>"},
        }
      ]
    },

    "http://id.loc.gov/authorities/geographics" : {
			"name":"geographics",
			"type":"complex",
			"processor" : 'lcAuthorities',
			"modes":[
				{
					'LCNAF Geographic':{"url":"https://id.loc.gov/authorities/names/suggest2/?q=<QUERY>&rdftype=Geographic&memberOf=http://id.loc.gov/authorities/names/collection_NamesAuthorizedHeadings&count=25&offset=<OFFSET>"},
					'LCSH Geographic':{"url":"https://id.loc.gov/authorities/subjects/suggest2/?q=<QUERY>&rdftype=Geographic&memberOf=http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings&count=25&offset=<OFFSET>"},
					//'GACS':{"url":"https://id.loc.gov/vocabulary/geographicAreas/suggest2/?q=<QUERY>&rdftype=Geographic&count=25&offset=<OFFSET>"},
				}
			]
		},

    "http://id.loc.gov/vocabulary/maudience" : {
			"name":"audience",
			"type":"complex",
			"processor" : 'lcAuthorities',
			"modes":[
				{
					'MARC Audience':{"url": "https://id.loc.gov/vocabulary/maudience.html"},
					'LCDGT':{"url": "https://id.loc.gov/authorities/demographicTerms/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
				}
			]
		},


    "HierarchicalGeographic": {
      "name":"names",
      "type":"complex",
      "processor" : 'lcAuthorities',

      "modes":[
        {
          'All':{"url":"https://preprod-8080.id.loc.gov/suggest2/?q=<QUERY>&count=25&rdftype=HierarchicalGeographic", "all":true},
        }
      ]
    },

    // this will search across names and subjects, the above only searches names
    "HierarchicalGeographicAll": {
      "name":"names",
      "type":"simple",
      "processor" : 'lcAuthorities',
      "modes":[
        {
          'All':{"url":"https://preprod-8080.id.loc.gov/suggest2/?q=<QUERY>&count=25&rdftype=HierarchicalGeographic", "all":true},
        }
      ]
    },

    // "http://id.loc.gov/authorities/demographicTerms": {
    //   "name":"demographicTerms",
    //   "type":"complex",
    //   "processor" : 'lcAuthorities',
    //   "modes":[
    //     {
    //       'LCDGT All':{"url":"https://preprod-8288.id.loc.gov/authorities/demographicTerms/suggest2/?q=<QUERY>", "all":true},
    //     }
    //   ]
    // },


    "http://id.loc.gov/entities/providers" : {"name":"providers", "type":"complex", "modes":[]},
    "http://id.loc.gov/entities/relationships" : {"name":"relationships", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "All":{"url":"https://id.loc.gov/entities/relationships/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
      }
    ]},
    "http://id.loc.gov/vocabulary/geographicAreas" : {"name":"geographicAreas", "processor" : 'lcAuthorities', "type":"complex", "minCharBeforeSearch":2, "modes":[
      {
      "All":{"url":"https://id.loc.gov/vocabulary/geographicAreas/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
      }
    ]},

    "https://preprod-8230.id.loc.gov/resources/works" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Works - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>&searchtype='keyword'", "all":true},
      "Works - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>&searchtype='keyword'"},

      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      }
    ]},

    "https://preprod-8088.id.loc.gov/resources/works/" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Works - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>", "all":true},
      "Works - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      }
    ]},




    "https://preprod-8295.id.loc.gov/resources/works" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Works - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>", "all":true},
      "Works - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      }
    ]},

    "https://preprod-8210.id.loc.gov/resources/works/" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Works - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>", "all":true},
      "Works - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      }
    ]},


    "https://preprod-8295.id.loc.gov/resources/works/" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Works - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>", "all":true},
      "Works - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Keyword":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>"},

      "Hubs - Left Anchored":{"url":"https://preprod-8295.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},

      }
    ]},





    // "https://preprod-8080.id.loc.gov/resources/works" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
    //   {
    //   "Works - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>&searchtype=keyword", "all":true},
    //   "Works - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
    //   "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>&searchtype=keyword"},
    //   "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
    //   }
    // ]},

    // "https://preprod-8080.id.loc.gov/resources/works/" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
    //   {
    //   "Works - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>", "all":true},
    //   "Works - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/works/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
    //   "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>"},
    //   "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
    //   }
    // ]},

    "https://preprod-8080.id.loc.gov/resources/hubs" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>","all":true},
      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
      }
    ]},
    "https://preprod-8080.id.loc.gov/resources/hubs/" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>","all":true},
      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
      }
    ]},


    "https://id.loc.gov/resources/hubs" : {"name":"Works", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>","all":true},
      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
      }
    ]},




    "https://preprod-8080.id.loc.gov/resources/hubs" : {"name":"Hubs", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "Hubs - Keyword":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=?<QUERY>&count=25&offset=<OFFSET>","all":true},
      "Hubs - Left Anchored":{"url":"https://preprod-8080.id.loc.gov/resources/hubs/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>"},
      }
    ]},


    "https://preprod-8080.id.loc.gov/resources/instances" : {"name":"Instances", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "All":{"url":"https://preprod-8080.id.loc.gov/resources/instances/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
      }
    ]},

    "https://preprod-8230.id.loc.gov/resources/instances" : {"name":"Instances", "processor" : 'lcAuthorities', "type":"complex", "modes":[
      {
      "All":{"url":"https://preprod-8080.id.loc.gov/resources/instances/suggest2/?q=<QUERY>&count=25&offset=<OFFSET>", "all":true},
      }
    ]},



    "http://id.loc.gov/entities/roles" : {"name":"roles", "type":"complex", "modes":[]},
    "http://id.loc.gov/resources/works" : {"name":"works", "type":"complex", "modes":[]},
    "http://id.loc.gov/rwo/agents" : {"name":"agents", "type":"complex", "modes":[]},
    "http://id.loc.gov/vocabulary/carriers" : {"name":"carriers", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/classSchemes" : {"name":"classSchemes", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/contentTypes" : {"name":"contentTypes", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/countries" : {"name":"countries", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/descriptionConventions" : {"name":"descriptionConventions", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/frequencies" : {"name":"frequencies", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/genreFormSchemes" : {"name":"genreFormSchemes", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/graphicMaterials" : {"name":"graphicMaterials", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/issuance" : {"name":"issuance", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/languages" : {"name":"languages", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/marcauthen" : {"name":"marcauthen", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/marcgt" : {"name":"marcgt", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/maspect" : {"name":"maspect", "type":"simple", "modes":[]},
    // "http://id.loc.gov/vocabulary/maudience" : {"name":"maudience", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mbroadstd" : {"name":"mbroadstd", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mcapturestorage" : {"name":"mcapturestorage", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mcolor" : {"name":"mcolor", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mediaTypes" : {"name":"mediaTypes", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/menclvl" : {"name":"menclvl", "type":"simple", "modes":[]},

    "http://id.loc.gov/vocabulary/mfiletype" : {"name":"mfiletype", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mgeneration" : {"name":"mgeneration", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mgroove" : {"name":"mgroove", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/millus" : {"name":"millus", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mlayout" : {"name":"mlayout", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mmaterial" : {"name":"mmaterial", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mmusicformat" : {"name":"mmusicformat", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mmusnotation" : {"name":"mmusnotation", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mplayback" : {"name":"mplayback", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mpolarity" : {"name":"mpolarity", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mpresformat" : {"name":"mpresformat", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mproduction" : {"name":"mproduction", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mrecmedium" : {"name":"mrecmedium", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mrectype" : {"name":"mrectype", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mregencoding" : {"name":"mregencoding", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mrelief" : {"name":"mrelief", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mscale" : {"name":"mscale", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mscript" : {"name":"mscript", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/msoundcontent" : {"name":"msoundcontent", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mspecplayback" : {"name":"mspecplayback", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mstatus" : {"name":"mstatus", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/msupplcont" : {"name":"msupplcont", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/mtechnique" : {"name":"mtechnique", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/organizations" : {"name":"organizations", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/relators" : {"name":"relators", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/resourceComponents" : {"name":"resourceComponents", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/resourceTypes" : {"name":"resourceTypes", "type":"simple", "modes":[]},
    "http://id.loc.gov/vocabulary/subjectSchemes" : {"name":"subjectSchemes", "type":"simple", "modes":[]},
    "http://mlvlp04.loc.gov:3000/verso/api/configs?filter[where][configType]=noteTypes&filter[fields][json]=true" : {"name":"true", "type":"simple", "modes":[]},
    "http://mlvlp04.loc.gov:8080/authorities/classification/G" : {"name":"G", "type":"simple", "modes":[]},
    "http://mlvlp04.loc.gov:8230/resources/instances" : {"name":"instances", "type":"simple", "modes":[]},
    "http://mlvlp04.loc.gov:8230/resources/works" : {"name":"works", "type":"simple", "modes":[]},
    "http://mlvlp06.loc.gov:8288/resources/hubs" : {"name":"hubs", "type":"simple", "modes":[]},
    "http://mlvlp06.loc.gov:8288/resources/works" : {"name":"works", "type":"simple", "modes":[]},
    "http://rdaregistry.info/termList/RDAContentType/" : {"name":"RDAContentType/", "type":"simple", "modes":[]},
    "http://www.rdaregistry.info/termList/RDAColourContent/" : {"name":"RDAColourContent/", "type":"simple", "modes":[]},
    "https://lookup.ld4l.org/authorities/search/linked_data/dbpedia_ld4l_cache" : {"name":"dbpedia_ld4l_cache", "type":"simple", "modes":[]},
    "https://lookup.ld4l.org/authorities/search/linked_data/getty_aat_ld4l_cache" : {"name":"getty_aat_ld4l_cache", "type":"simple", "modes":[]},


    "https://www.wikidata.org/w/api.php" : {
      "name":"wikidata",
      "type":"complex",
      "processor" : 'wikidataAPI',

      "modes":[
        {
          'Wikidata':{"url":"https://www.wikidata.org/w/api.php?action=wbsearchentities&search=<QUERY>&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*", "all":true},


        }
      ]
    }
  },

  scriptShifterLangCodes:{
    "abkhaz_cyrillic": {
        "code": "ab-Cyrl"
    },
    "altai_cyrillic": {
        "code": "alt-Cyrl"
    },
    "arabic": {
        "code": "ar-Arab"
    },
    "armenian": {
        "code": "hy-Armn"
    },
    "azerbaijani_cyrillic": {
        "code": "az-Cyrl"
    },
    "bashkir_cyrillic": {
        "code": "ba-Cyrl"
    },
    "belarusian": {
        "code": "be-Cyrl"
    },
    "bengali": {
        "code": "bn-Beng"
    },
    "bulgarian": {
        "code": "bg-Cyrl"
    },
    "buriat": {
        "code": "bua-Cyrl"
    },
    "burmese": {
        "code": "my-Mymr"
    },
    "chinese": {
        "code": "zh-Hani"
    },
    "chukchi_cyrillic": {
        "code": "ckt-Cyrl"
    },
    "church_slavonic": {
        "code": "cu-Cyrs"

    },
    "chuvash_cyrillic": {
        "code": "cv-Cyrl"
    },
    "divehi_thaana": {
        "code": "dv-Thaa"
    },
    "dogri_devanagari": {
        "code": "doi-Deva"
    },
    "dungan_cyrillic": {
        "code": "dng-Cyrl"
    },
    "ethiopic": {
        "code": "am-Ethi"
    },
    "even-evenki_cyrillic": {
        "code": "evn-Cyrl"
    },
    "gagauz_cyrillic": {
        "code": "gag-Cyrl"
    },
    "georgian": {
        "code": "ka-Geor"
    },
    "greek_classical": {
        "code": "grc-Grek"
    },
    "greek_modern": {
        "code": "el-Grek"
    },
    "gujarati": {
        "code": "gu-Gujr"
    },
    "hebrew": {
        "code": "he-Hebr"
    },
    "hindi": {
        "code": "hi-Deva"
    },
    "hiragana": {
        "code": "ja-Hrkt"
    },
    "kalmyk_cyrillic": {
        "code": "xal-Cyrl"
    },
    "kannada": {
        "code": "kn-Knda"
    },
    "kara-kalpak_cyrillic": {
        "code": "kaa-Cyrl"
    },
    "karachai-balkar_cyrillic": {
        "code": "krc-Cyrl"
    },
    "karelian_cyrillic": {
        "code": "krl-Cyrl"
    },
    "katakana": {
        "code": "ja-Kana"
    },
    "kazakh_cyrillic": {
        "code": "kk-Cyrl"
    },
    "khakass_cyrillic": {
        "code": "kjh-Cyrl"
    },
    "khanty_cyrillic": {
        "code": "kca-Cyrl"
    },
    "khmer": {
        "code": "km-Khmr"
    },
    "komi_cyrillic": {
        "code": "kv-Cyrl"
    },
    "korean_names": {
        "code": "ko-Kore"
    },
    "korean_nonames": {
        "code": "ko-Kore"
    },
    "koryak_cyrillic": {
        "code": "kpy-Cyrl"
    },
    "kurdish": {
        "code": "ku-Arab"
    },
    "kyrgyz_cyrillic": {
        "code": "ky-Cyrl"
    },
    "lithuanian_cyrillic": {
        "code": "lt-Cyrl"
    },
    "macedonian": {
        "code": "mk-Cyrl"
    },
    "malayalam": {
      "code": "ml-Mlym"
    },
    "mansi_cyrillic": {
        "code": "mns-Cyrl"
    },
    "marathi_devanagari": {
        "code": "mr-Deva"
    },
    "moldovan_cyrillic": {
        "code": "ro-Cyrl"
    },
    "mongolian_cyrillic": {
        "code": "mn-Cyrl"
    },
    "mongolian_mongol_bichig": {
        "code": "mn-Mong"
    },
    "mordvin_cyrillic": {
        "code": "myv-Cyrl"
    },
    "nenets_cyrillic": {
        "code": "yrk-Cyrl"
    },
    "nepali_devanagari": {
        "code": "ne-Deva"
    },
    "newari_devanagari": {
        "code": "new-Deva"
    },
    "oriya": {
        "code": "or-Orya"
    },
    "ossetic_cyrillic": {
        "code": "os-Cyrl"
    },
    "pali": {
        "code": "pi-Deva"
    },
    "panjabi": {
        "code": "pa-Guru"
    },
    "persian": {
        "code": "fa-Deva"
    },
    "prakrit_devanagari": {
        "code": "pra-Deva"
    },
    "pulaar": {
        "code": "fuc-Adlm"
    },
    "pushto": {
        "code": "ps-Arab"
    },
    "rajasthani_devanagari": {
        "code": "raj-Deva"
    },
    "romani_cyrillic": {
        "code": "rom-Cyrl"
    },
    "russian": {
        "code": "ru-Cyrl"
    },
    "sanskrit_devanagari": {
        "code": "sa-Deva"
    },
    "serbian": {
        "code": "sr-Cyrl"
    },
    "shor_cyrillic": {
        "code": "cjs-Cyrl"
    },
    "sinhalese": {
        "code": "si-Sinh"
    },
    "syriac_cyrillic": {
        "code": "syr-Cyrl"
    },
    "tajik_cyrillic": {
        "code": "tg-Cyrl"
    },
    "tamil": {
        "code": "ta-Taml"
    },
    "tamil_brahmi": {
        "code": "ta-Brah"
    },
    "tamil_extended": {
        "code": "ta-Taml"
    },
    "tatar-kryashen_cyrillic": {
        "code": "tt-Cyrl"
    },
    "tatar_cyrillic": {
        "code": "tt-Cyrl"
    },
    "telugu": {
        "code": "te-Telu"
    },
    "thai": {
        "code": "th-Thai"
    },
    "thai_alt": {
        "code": "th-Thai"
    },
    "tibetan": {
        "code": "bo-Tibt"
    },
    "turkmen_cyrillic": {
        "code": "tk-Cyrl"
    },
    "tuvinian_cyrillic": {
        "code": "tyv-Cyrl"
    },
    "udmurt_cyrillic": {
        "code": "udm-Cyrl"
    },
    "uighur_cyrillic": {
        "code": "ug-Cyrl"
    },
    "ukrainian": {
        "code": "uk-Cyrl"
    },
    "urdu": {
      "code": "ur-Urdu"
    },
    "uzbek_cyrillic": {
        "code": "uz-Cyrl"
    },
    "yakut_cyrillic": {
        "code": "sah-Cyrl"
    },
    "yiddish": {
        "code": "yi-Hebr"
    },
    "yuit_cyrillic": {
        "code": "ypk-Cyrl"
    }
  }


  }),
  getters: {

    /**
    * Returns the part of the config based on the current URL (or enviornment)
    * @return {object} - The url config object
    */
    returnUrls: (state) => {
      // testing for window here because of running unit tests in node
      if (typeof window !== 'undefined'){
        if (window && (window.location.href.startsWith('http://localhost') || window.location.href.startsWith('http://127.0.0.1'))){
          return state.regionUrls.dev
        }else if (window && window.location.href.startsWith('https://preprod-3001')){
          return state.regionUrls.staging
        }else if (window && window.location.href.startsWith('https://editor.id')){
          return state.regionUrls.production
        }else if (window && window.location.href.includes('bibframe.org')){
          return state.regionUrls.bibframeDotOrg
        }else{
          return state.regionUrls.dev
        }
      }else{
        return state.regionUrls.dev
      }
    }



  },
  actions: {

    /**
    * Take a url and rewrites it to match the url pattern of the current enviornment
    * @param {string} url - the url to modfidfy
    * @return {string} - the url modified to the match the env
    */
    convertToRegionUrl(url) {
      let urls = this.returnUrls
      if ((url.includes('/works/') || url.includes('/instances/') || url.includes('/items/') || url.includes('/hubs/') ) && url.includes('http://id.loc.gov') ){
        url = url.replace('http://id.loc.gov/',urls.bfdb)
      }
      return url
    },

    /**
    * Ask the scriptshifter endpoint for supported langauges
    *
    * @return {void} -
    */
    async getScriptShifterLanguages() {

      let req = await fetch(this.returnUrls.scriptshifter + 'languages')
      this.scriptshifterLanguages = await req.json()




    },

    /**
    * Ask the backend for the current version if out of date flip the flag
    *
    * @return {void} -
    */
    async checkVersionOutOfDate() {


      if (await utilsNetwork.checkVersionOutOfDate()){
        this.showUpdateAvailableModal = true
      }

    },







  },
})