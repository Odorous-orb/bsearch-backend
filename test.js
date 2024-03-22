const { get_all_blank_node, delete_record_from_resource, search_entity, check_error, delete_all_entity, search_rdf, sync_sparql_cmd } = require("./api_rdfdb");

var del_items = [
  '4fb6d184-8b19-4457-9b6a-f6b802b99924',
  '7dd0c8ed-afcd-4391-a913-df46515fa3772023-03-30T02:35:28.182Z',
  '425c1cee-f6d2-4e37-a200-8a92a72c7ac4',
  '5864dc16-7e3e-493f-b3d9-a8ecabfe62922023-03-24T07:16:25.497Z',
  'c4767243-a435-4cd4-9ac4-980ca17b99872023-03-27T08:19:50.870Z',
  'f048a721-736c-4ddd-86c6-268e85017cf32023-03-29T',
  '482777d1-214a-4c35-96b2-168190ae0132',
  'ac25201c-c74c-4c25-adac-640a41fd8e7c',
  '4d5a2a19-4c9d-4081-b4e3-114c53069606',
  'fb777ed0-3b51-43af-81f8-94142942d51e',
  

]

var del_enities = [
  'http://www.accziom.com/ontology/entity/business/bs_4847d0b8-f0d3-4cc9-bdb4-48f5e385c546',
  'http://www.accziom.com/ontology/entity/business/bs_65d6d9b3-b25f-4ef6-b7d0-9968abb14792',
  'http://www.accziom.com/ontology/entity/business/bs_fe7ed305-bf5f-43f2-8468-2c66070dcc87',
  'http://www.accziom.com/ontology/entity/business/bs_1e51e698-0e7f-442f-a0bf-ce5dedb38586',
  'http://www.accziom.com/ontology/entity/business/bs_69c76193-3a57-4281-a513-69bab8e8e96e',
  'http://www.accziom.com/ontology/entity/business/bs_42c2017c-8882-49c8-a9b7-b49b2bfc1819',
  'http://www.accziom.com/ontology/entity/person/ps_d7c09f50-6d92-4605-8577-e795213921d3',
  'http://www.accziom.com/ontology/entity/business/bs_49fa25f4-e55d-4732-9e15-6a15bc35f46e',
  'http://www.accziom.com/ontology/entity/business/bs_583dbbe5-91ec-4632-bd83-a1af0799fe9c',
  'http://www.accziom.com/ontology/entity/business/bs_5852b4d2-d060-4e87-b305-07918fcf255a',
  'http://www.accziom.com/ontology/entity/business/bs_d73ba2b6-e8af-4c6a-b08c-9e4b1d6577fb',
  'http://www.accziom.com/ontology/entity/business/bs_806df8ea-1727-4db2-b88c-e79f7afb1b62',
  'http://www.accziom.com/ontology/entity/business/bs_651a41fe-d35e-4e8b-ab6d-39c408321e9c',
  'http://www.accziom.com/ontology/entity/business/bs_7c143fde-f6c9-48d2-b3ee-731929050c94',
  'http://www.accziom.com/ontology/entity/business/bs_08d60cc2-5141-4c02-9a96-73ef64b9d467',
  'http://www.accziom.com/ontology/entity/business/bs_d2d4e4f6-bdbb-4969-b301-422c41ea79e7'
]

async function mm() {
  let r = await sync_sparql_cmd(
    `
      select *
      from <accziom>
      where {
        ?s ?p ?o
      } LIMIT 10
    `
  )
  console.log(r)
  let res = await search_rdf({query:"lodgeit"}, "accziom")
  console.log(res)
  //search_entity('<http://www.accziom.com/ontology/entity/business/bs_5852b4d2-d060-4e87-b305-07918fcf255a>')
  check_error()
  /*
  for (var i = 0 ; i < del_items.length; i++) {
    var item = del_items[i];
    await delete_record_from_resource(item);
  }
  */
 /*for (var i = 0 ; i < del_enities; i++) {
  var item = del_enities[i]
  await delete_all_entity('<' + item + '>')
 }*/
}

mm()