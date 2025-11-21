// agGridLwc.js
import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import AG_GRID_JS from '@salesforce/resourceUrl/testAgGrid';
import AG_GRID_CSS from '@salesforce/resourceUrl/testAgGrid';

import getObjects from '@salesforce/apex/ObjectFieldController.getObjects';
import getFields from '@salesforce/apex/ObjectFieldController.getFields';
//import saveGridData from '@salesforce/apex/ObjectFieldController.saveGridData';

export default class TestExcelDisplay extends LightningElement {
    @track objectOptions = [];
    @track selectedObject = '';
    @track fieldOptions = [];
    @track selectedFields = [];

    gridJsInitialized = false;
    gridOptions;
    gridApi;
    gridColumnApi;

    connectedCallback() {
        getObjects().then(result => {
            this.objectOptions = result.map(obj => ({ label: obj, value: obj }));
        });
    }

    renderedCallback() {
        if (this.gridJsInitialized) return;

        Promise.all([
            loadScript(this, AG_GRID_JS + '/ag-grid-community.min.noStyle.js'),
            loadStyle(this, AG_GRID_CSS + '/ag-grid.min.css')
        ])
        .then(() => {
            this.gridJsInitialized = true;
        })
        .catch(error => {
            console.error('AG Grid load error', error);
        });
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.selectedFields = [];
        this.fieldOptions = [];
        getFields({ objectName: this.selectedObject }).then(result => {
            this.fieldOptions = result.map(f => ({ label: f, value: f }));
        });
    }

    handleFieldChange(event) {
        this.selectedFields = event.detail.value;
        this.initAgGrid();
    }

    initAgGrid() {
        if (!this.gridJsInitialized || !this.selectedFields.length) return;

        const container = this.template.querySelector('.agGridContainer');
        container.innerHTML = ''; // clear previous grid

        const columnDefs = this.selectedFields.map(f => ({
            headerName: f,
            field: f,
            editable: true,
            resizable: true
        }));

        this.gridOptions = {
            columnDefs: columnDefs,
            defaultColDef: {
                editable: true,
                sortable: true,
                filter: true,
                resizable: true
            },
            rowData: [],
            rowSelection: 'multiple',
            animateRows: true,
            enableRangeSelection: true,
        };

        this.gridApi = new agGrid.Grid(container, this.gridOptions).gridOptions.api;
        this.gridColumnApi = this.gridOptions.columnApi;
    }

    // handleSave() {
    //     if (!this.gridApi) return;

    //     const rowData = [];
    //     this.gridApi.forEachNode(node => rowData.push(node.data));

    //     saveGridData({ objectName: this.selectedObject, records: rowData })
    //         .then(() => alert('Records saved successfully!'))
    //         .catch(err => console.error(err));
    // }
}