public with sharing class ExcelDataLoader {

    //  Get all available SObjects
    @AuraEnabled(cacheable=true)
    public static List<ObjectMetadataWrapper> getObjects() {
        List<ObjectMetadataWrapper> objectWrappers = new List<ObjectMetadataWrapper>();
        Map<String, Schema.SObjectType> allObjects = Schema.getGlobalDescribe();

        for (Schema.SObjectType objType : allObjects.values()) 
        {
            Schema.DescribeSObjectResult d = objType.getDescribe();
            String apiName = d.getName();

            // Skip non-queryable, custom settings, or unwanted system/flow objects
            if (
                !d.isQueryable() ||
                d.isCustomSetting() ||
                apiName.startsWith('Flow') ||                      // Flow-related objects
                apiName.endsWith('History') ||                     // History tracking tables
                apiName.endsWith('Share') ||                       // Sharing tables
                apiName.contains('ChangeEvent') ||                 // Change event objects
                apiName.contains('Feed') ||                        // Feed / chatter-related
                apiName.contains('FieldDefinition') ||             // Metadata/Field definitions
                apiName.contains('EntityDefinition') ||
                apiName.contains('Label') ||                       // StandardFieldLabel etc.
                apiName.contains('RecordType')                     // System metadata
            ) {
                continue; // Skip this object
            }

            objectWrappers.add(new ObjectMetadataWrapper(apiName, d.getLabel()));

            // // Filter out non-queryable and CustomSettings
            // if (!d.isCustomSetting() && d.isQueryable()) {
            //     objectWrappers.add(
            //         new ObjectMetadataWrapper(d.getName(), d.getLabel())
            //     );
            // }
        }

        // Sort alphabetically by label
        //objectWrappers.sort();
        objectWrappers.sort(new CompareObjectLabels());
        return objectWrappers;
    }

    //  Get field metadata for a specific object
    @AuraEnabled(cacheable=true)
    public static List<FieldMetadataWrapper> getFields(String objectName) {
        List<FieldMetadataWrapper> fieldWrappers = new List<FieldMetadataWrapper>();

        Schema.DescribeSObjectResult d = Schema.getGlobalDescribe().get(objectName).getDescribe();
        Map<String, Schema.SObjectField> fields = d.fields.getMap();
        //FieldMetadataWrapper addFieldData = new FieldMetadataWrapper(String, String, String, Boolean);
        System.debug('FIELDS MAP: ' + fields);
        for (String fName : fields.keySet()) {
            Schema.DescribeFieldResult fr = fields.get(fName).getDescribe();
            if (fr.isAccessible()) {
                fieldWrappers.add(new FieldMetadataWrapper(
                    fName,
                    fr.getLabel(),
                    String.valueOf(fr.getType()),
                    fr.isAccessible()
                ));
            }
        }

        fieldWrappers.sort(new CompareFieldLabels());
        return fieldWrappers;
    }

    //  Get records
    @AuraEnabled
    public static List<Map<String, Object>> getRecords(String objectName, List<String> fieldNames) {
        String query = 'SELECT ' + String.join(fieldNames, ',') + ' FROM ' + objectName + ' LIMIT 200';
        System.debug('QUERY: ' + query);

        List<SObject> sObjList = Database.query(query);
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        for (SObject sobj : sObjList) {
            Map<String, Object> rec = new Map<String, Object>();
            rec.put('Id', sobj.get('Id'));
            for (String f : fieldNames) {
                try {
                    rec.put(f, sobj.get(f));
                } catch (Exception e) {
                    rec.put(f, null);
                }
            }
            results.add(rec);
        }

        return results;
    }

    //  Save Records
    @AuraEnabled
    public static void saveRecords(String objectName, List<Map<String, Object>> records) {
        List<SObject> sobjList = new List<SObject>();
        for (Map<String, Object> record : records) {
            SObject s = (SObject) Type.forName('Schema.' + objectName).newInstance();
            for (String key : record.keySet()) {
                s.put(key, record.get(key));
            }
            sobjList.add(s);
        }
        update sobjList;
    }

    @AuraEnabled
    public static String generateCSVFromData(List<Map<String, Object>> records, List<String> fieldNames) {
        if(records == null || records.isEmpty() || fieldNames.isEmpty()) {
            return '';
        }

        // Build CSV header
        List<String> header = new List<String>();
        for(String f : fieldNames) {
            header.add('"' + f + '"');
        }
        List<String> csvRows = new List<String>();
        csvRows.add(String.join(header, ','));

        // Build CSV rows
        for(Map<String, Object> rec : records) {
            List<String> row = new List<String>();
            for(String f : fieldNames) {
                Object val = rec.get(f);
                String strVal = (val != null) ? String.valueOf(val) : '';
                strVal = strVal.replace('"','""'); // escape quotes
                row.add('"' + strVal + '"');
            }
            csvRows.add(String.join(row, ','));
        }

        return String.join(csvRows, '\n');
    }
}



//public class ExcelDataLoader {
    
//     // method to get Object details from SF schema
//     @AuraEnabled(cacheable=true)
//     public static List<String> getObjects() {
//         List<String> objectNames = new List<String>();
//         for (Schema.SObjectType sObj : Schema.getGlobalDescribe().values()) {
//             Schema.DescribeSObjectResult d = sObj.getDescribe();
//             if (!d.isCustomSetting() && d.isQueryable()) {
//                 objectNames.add(d.getName());
//             }
//         }
//         objectNames.sort();
//         return objectNames;
//     }

//     // method to get Object related field details from SF schema
//     @AuraEnabled(cacheable=true)
//     public static List<String> getFields(String objectName) {
//         Map<String, Schema.SObjectField> fields = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();
//         List<String> fieldNames = new List<String>();
//         for (String f : fields.keySet()) {
//             Schema.DescribeFieldResult fr = fields.get(f).getDescribe();
//             if (fr.isAccessible()) fieldNames.add(f);
//         }
//         fieldNames.sort();
//         return fieldNames;
//     }

//     // method to get the data from SF object
//     @AuraEnabled
//     public static List<Map<String, Object>> getRecords(String objectName, List<String> fieldNames) 
//     {
//     // Build dynamic SOQL
//     String query = 'SELECT ' + String.join(fieldNames, ',') + ' FROM ' + objectName + ' LIMIT 200';
//     System.debug('QUERY: ' + query);
    
//     List<SObject> sObjList = Database.query(query);
//     List<Map<String, Object>> results = new List<Map<String, Object>>();

//     for (SObject sobj : sObjList) {
//         Map<String, Object> rec = new Map<String, Object>();
//         rec.put('Id', sobj.get('Id'));
//         for (String f : fieldNames) {
//             try {
//                 rec.put(f, sobj.get(f));
//             } catch (Exception e) {
//                 rec.put(f, null);
//             }
//         }
//         results.add(rec);
//     }
//     System.debug('RESULT: ' + results);
//     return results;
// }
    
//     // method to update data to SF object
//     @AuraEnabled
//     public static void saveRecords(String objectName, List<Map<String, Object>> records) 
//     {
//         List<SObject> sobjList = new List<SObject>();
//         for (Map<String, Object> record : records) {
//             SObject s = (SObject) Type.forName('Schema.' + objectName).newInstance();
//             for (String key : record.keySet()) {
//                 s.put(key, record.get(key));
//             }
//             sobjList.add(s);
//         }
//         update sobjList;
//     }

//     @AuraEnabled
// public static void deleteRecords(String objectName, List<Id> recordIds) {
//     if (String.isBlank(objectName) || recordIds == null || recordIds.isEmpty()) {
//         return;
//     }

//     try {
//         // Build dynamic SOQL
//         String query = 'SELECT Id FROM ' + objectName + ' WHERE Id IN :recordIds';
//         List<SObject> recordsToDelete = Database.query(query);

//         delete recordsToDelete;
//     } catch (Exception e) {
//         throw new AuraHandledException('Error deleting records: ' + e.getMessage());
//     }
// }