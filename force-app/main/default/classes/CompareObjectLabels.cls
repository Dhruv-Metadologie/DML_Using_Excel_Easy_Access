public class CompareObjectLabels implements System.Comparator<ObjectMetadataWrapper> {
    public Integer compare(ObjectMetadataWrapper a, ObjectMetadataWrapper b) {
        return a.label.toLowerCase().compareTo(b.label.toLowerCase());
    }
}

