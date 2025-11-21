public class ObjectMetadataWrapper {
    @AuraEnabled public String apiName { get; set; }
    @AuraEnabled public String label { get; set; }

    public ObjectMetadataWrapper(String apiName, String label) {
        this.apiName = apiName;
        this.label = label;
    }
}
