import { LightningElement, track } from 'lwc';
import getObjects from '@salesforce/apex/ExcelDataLoader.getObjects';
import getFields from '@salesforce/apex/ExcelDataLoader.getFields';
import getRecords from '@salesforce/apex/ExcelDataLoader.getRecords';
import saveRecords from '@salesforce/apex/ExcelDataLoader.saveRecords';
import LightningToast from "lightning/toast";
import generateCSVFromData from '@salesforce/apex/ExcelDataLoader.generateCSVFromData';

export default class DataManager extends LightningElement {
    @track objectOptions = [];
    @track fieldOptions = [];
    @track selectedObject;
    @track selectedFields = []; // stores API names
    @track selectedFieldLabels = []; // stores labels for display
    @track records;
    @track columns = [];
    @track showConfigPanel = false;
    @track dataLoaded = false;
    @track searchKey = '';
    @track filteredRecords = [];

    async connectedCallback() {
        await this.loadObjects();
    }

    // Load all SObjects (using label for display, apiName for value)
    async loadObjects() {
        try {
            const objs = await getObjects();
            this.objectOptions = objs.map(o => ({
                label: o.label,
                value: o.apiName
            }));
            //console.log('Loaded objects:', JSON.stringify(this.objectOptions, null, 2));
        } catch (error) {
            console.error('Error loading objects:', error);
            this.objectOptions = [];
        }
    }

    // When object changes, fetch its fields
    async handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        try {
            const fields = await getFields({ objectName: this.selectedObject });
            this.fieldOptions = fields.map(f => ({
                label: f.label,
                value: f.apiName
            }));
        } catch (error) {
            console.error('Error loading fields:', error);
            this.fieldOptions = [];
        }
    }

    // Track both selected field labels and apiNames
    handleFieldChange(event) {
        this.selectedFields = event.detail.value; // API names
        const selectedOptions = this.fieldOptions.filter(opt => this.selectedFields.includes(opt.value));
        this.selectedFieldLabels = selectedOptions.map(opt => opt.label);
    }

    // Load data records
    async loadData() {
        this.dataLoaded = true;
        if (!this.selectedObject || this.selectedFields.length === 0) return;

        try {
            const data = await getRecords({
                objectName: this.selectedObject,
                fieldNames: this.selectedFields
            });

            this.records = Array.isArray(data) && data.length > 0 ? data : [];
            this.filteredRecords = this.records;
            console.log('Filtered Records:', JSON.stringify(this.filteredRecords, null, 2));
            console.log('Selected Feilds:', JSON.stringify(this.selectedFields, null, 2));
            // Build datatable columns using field labels
            this.columns = this.selectedFields.map((label) => ({
                label: this.selectedFieldLabels[label] || label,
                fieldName: label,
                editable: label !== 'Id'
            }));
            console.log('Columns:', JSON.stringify(this.columns, null, 2));
            this.showConfigPanel = false;
            console.log('Loaded records:', JSON.stringify(this.records, null, 2));
        } catch (error) {
            console.error('Error loading data:', error);
            this.records = [];
        }
    }

    // Search filter logic
    handleSearchChange(event) {
        this.searchKey = event.target.value ? event.target.value.toLowerCase() : '';
        this.handleSearch();
    }

    handleSearch() {
        const input = this.template.querySelector('[data-id="searchInput"]');
        this.searchKey = input.value.toLowerCase();

        if (!this.searchKey) {
            this.filteredRecords = this.records;
            return;
        }

        this.filteredRecords = this.records.filter(record =>
            Object.values(record).some(value =>
                value && value.toString().toLowerCase().includes(this.searchKey)
            )
        );
    }

    toggleConfigPanel() {
        this.showConfigPanel = !this.showConfigPanel;
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    get noRecordsFound() {
        return this.dataLoaded && (!this.records || this.records.length === 0);
    }

    get noDataLoaded() {
        return !this.dataLoaded;
    }

    // Save updates back to Salesforce
    async handleSave(event) {
        const updated = event.detail.draftValues;
        try {
            await saveRecords({
                objectName: this.selectedObject,
                records: updated
            });
            await LightningToast.show({
                label: "Success",
                message : "Records updated successfully",
                variant : "success",
                mode: "dismissable"
            }, this);
            await this.loadData();  // refresh table
            this.handleSearch();
        } catch (error) {
            console.error('Error saving records:', error);
        }
    }
    
    async downloadCSVServer() 
    {
        if (!this.filteredRecords || this.filteredRecords.length === 0) return;

        try {
            // Apex expects List<Map<String, Object>>
            const csvString = await generateCSVFromData({
                records: this.filteredRecords,
                fieldNames: this.selectedFields
            });

            if (!csvString) return;

            // Download CSV
            //const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            //const link = document.createElement('a');
            //link.href = URL.createObjectURL(blob);
            //link.download = `${this.selectedObject}_${new Date().toISOString()}.csv`;

            const encodedUri = encodeURIComponent(csvString);
            const dataUri = `data:text/csv;charset=utf-8,${encodedUri}`;

            const link = document.createElement("a");
            link.setAttribute("href", dataUri);
            link.setAttribute("download", `${this.selectedObject}_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) 
        {
            console.error('Error generating CSV:', error);
        }
    }
}


// import { LightningElement, track } from 'lwc';
// import getObjects from '@salesforce/apex/ExcelDataLoader.getObjects';
// import getFields from '@salesforce/apex/ExcelDataLoader.getFields';
// import getRecords from '@salesforce/apex/ExcelDataLoader.getRecords';
// import saveRecords from '@salesforce/apex/ExcelDataLoader.saveRecords';

// export default class DataManager extends LightningElement {
//     @track objectOptions = [];
//     @track fieldOptions = [];
//     @track selectedObject ;
//     @track selectedFields = [];
//     @track records;
//     @track columns = [];
//     @track showConfigPanel = false;
//     @track dataLoaded = false; // track if loadData() was called at least once
//     @track searchKey = '';
//     @track filteredRecords = [];

//     async connectedCallback() {
//         this.loadObjects();
//     }

//     async loadObjects() {
//         const objs = await getObjects();
//         this.objectOptions = objs.map(o => ({ label: o, value: o }));
//     }

//     async handleObjectChange(event) {
//         this.selectedObject = event.detail.value;
//         const fields = await getFields({ objectName: this.selectedObject });
//         this.fieldOptions = fields.map(f => ({ label: f, value: f }));
//     }

//     handleFieldChange(event) {
//         this.selectedFields = event.detail.value;
//     }

//     async loadData() {
//     this.dataLoaded = true;

//     if (!this.selectedObject || this.selectedFields.length === 0) return;

//     try {
//         const data = await getRecords({
//             objectName: this.selectedObject,
//             fieldNames: this.selectedFields,
            
//         });

        
//         this.records = data && data.length > 0 ? data : [];
//         console.log(JSON.stringify(data, null, 2));
//         this.filteredRecords = this.records;
//         console.log('Filtered Records:', JSON.stringify(this.filteredRecords, null, 2));

//         this.columns = this.selectedFields.map(f => ({
//                 label: f,
//                 fieldName: f,
//                 editable: f !== 'Id'
//             })),
//             console.log(JSON.stringify(this.columns, null, 2));

//             this.showConfigPanel = false;
//         } catch (error) {
//             console.error(error);
//             this.records = [];
//         }
//     }

//     handleSearchChange(event) {
//     this.searchKey = event.target.value ? event.target.value.toLowerCase() : '';
//     this.handleSearch();
//     }

//     handleSearch() {
//     const input = this.template.querySelector('[data-id="searchInput"]');
//     console.log('Search input value:', input.value);
//     this.searchKey = input.value.toLowerCase();
//     console.log('Search key:', this.searchKey);

//     if (!this.searchKey) {
//         this.filteredRecords = this.records;
//         console.log('No search key, showing all records');
//         return;
//     }

//     this.filteredRecords = this.records.filter(record => {
//         return Object.values(record)
//             .some(value => value && value.toString().toLowerCase().includes(this.searchKey));
//     });
// }

    
//     toggleConfigPanel() {
//         this.showConfigPanel = !this.showConfigPanel;
//     }

//     // Getters to control rendering
//     get hasRecords() {
//         return this.records && this.records.length > 0;
//     }

//     get noRecordsFound() {
//         return this.dataLoaded && (!this.records || this.records.length === 0);
//     }

//     get noDataLoaded() {
//         return !this.dataLoaded;
//     }

    
//     async handleSave(event) {
//         const updated = event.detail.draftValues;
//         await saveRecords({
//             objectName: this.selectedObject,
//             records: updated
//         });
//         this.loadData(); // refresh
//     }
// }


    

