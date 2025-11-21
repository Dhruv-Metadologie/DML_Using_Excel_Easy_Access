public class CompareFieldLabels implements System.Comparator<FieldMetadataWrapper> {
    public Integer compare(FieldMetadataWrapper a, FieldMetadataWrapper b) {
        return a.label.toLowerCase().compareTo(b.label.toLowerCase());
    }
}
