import { LightningElement, api, track } from 'lwc';

export default class EditableGrid extends LightningElement {
    @api filteredRecords;
    @api columns;
    @track draftValues = [];
    //searchKey = '';

    // connectedCallback() {
    //     // Initialize filteredRecords with all records
    //     this.filteredRecords = this.records;
    // }

    handleSave(event) {
        this.dispatchEvent(new CustomEvent('save', { detail: event.detail }));
    }

    // handleSearch(event){
    //     this.searchKey = event.detail;
    //     console.log('Search event details: ' + this.searchKey);
    //     this.dispatchEvent(new CustomEvent('search', { detail: this.searchKey }));
    // }
    // handleDelete(event) {
    //     this.dispatchEvent(new CustomEvent('delete', { detail: event.detail }));
    // }

}
