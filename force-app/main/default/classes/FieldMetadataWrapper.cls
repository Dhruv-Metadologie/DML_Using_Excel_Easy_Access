public class FieldMetadataWrapper {
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String type { get; set; }
        @AuraEnabled public Boolean isAccessible { get; set; }

        public FieldMetadataWrapper(String apiName, String label, String type, Boolean isAccessible) {
            this.apiName = apiName;
            this.label = label;
            this.type = type;
            this.isAccessible = isAccessible;
        }
    }