public with sharing class ObjectFieldController {

    // Fetch picklist of all SObject names
    @AuraEnabled(cacheable=true)
    public static List<String> getObjects() {
        List<String> objectNames = new List<String>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        for(String name : gd.keySet()){
            objectNames.add(name);
        }
        objectNames.sort();
        return objectNames;
    }

    // Fetch fields for a selected object
    @AuraEnabled(cacheable=true)
    public static List<String> getFields(String objectName) {
        if(String.isBlank(objectName)) return new List<String>();
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();
        List<String> fieldNames = new List<String>();
        for(String fName : fieldMap.keySet()){
            // Include only createable fields
            if(fieldMap.get(fName).getDescribe().isCreateable()){
                fieldNames.add(fName);
            }
        }
        fieldNames.sort();
        return fieldNames;
    }

    // Save grid data to Salesforce
    // @AuraEnabled
    // public static void saveGridData(String objectName, List<Map<String, Object>> records) {
    //     if(String.isBlank(objectName) || records == null || records.isEmpty()) return;

    //     List<SObject> sObjects = new List<SObject>();
    //     Schema.SObjectType sobjType = Schema.getGlobalDescribe().get(objectName);

    //     for(Map<String, Object> row : records){
    //         SObject sobj = sobjType.newSObject();
    //         for(String key : row.keySet()){
    //             sobj.put(key, row.get(key));
    //         }
    //         sObjects.add(sobj);
    //     }

    //     if(!sObjects.isEmpty()){
    //         insert sObjects;
    //     }
    // }
}
