import { Component, ViewEncapsulation, Inject, ViewChild } from '@angular/core';
import { watingProjectListWSOData, scheduleConstraintWSOData } from './data';

import { MaskedTextBoxComponent } from '@syncfusion/ej2-angular-inputs';
import {
  DataManager,
  Query,
  ReturnOption,
  Predicate,
} from '@syncfusion/ej2-data';

import {
  extend,
  closest,
  remove,
  addClass,
  isNullOrUndefined,
} from '@syncfusion/ej2-base';
import {
  EventSettingsModel,
  View,
  GroupModel,
  TimelineViewsService,
  TimelineMonthService,
  ResizeService,
  WorkHoursModel,
  DragAndDropService,
  ResourceDetails,
  ScheduleComponent,
  ActionEventArgs,
  CellClickEventArgs,
} from '@syncfusion/ej2-angular-schedule';
import { DragAndDropEventArgs } from '@syncfusion/ej2-navigations';
import { TreeViewComponent } from '@syncfusion/ej2-angular-navigations';
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    TimelineViewsService,
    TimelineMonthService,
    ResizeService,
    DragAndDropService,
  ],
})
export class AppComponent {
  @ViewChild('scheduleObj') public scheduleObj: ScheduleComponent;
  @ViewChild('treeObj') public treeObj: TreeViewComponent;
  @ViewChild('maskObj') maskObj: MaskedTextBoxComponent;

  public isTreeItemDropped = false;
  public draggedItemId = '';

  public data: Record<string, any>[] = extend(
    [],
    scheduleConstraintWSOData,
    null,
    true
  ) as Record<string, any>[];
  public selectedDate: Date = new Date(2021, 7, 2);
  public monthInterval: number = 60;
  public workHours: WorkHoursModel = { start: '08:00', end: '18:00' };

  public consultantDataSource: Record<string, any>[] = [
    {
      Text: 'Chao Phraya (J)',
      Id: 104,
      GroupId: 104,
      Color: '#bbdc00',
      Designation: '',
    },
    {
      Text: 'Krathong (J)',
      Id: 105,
      GroupId: 105,
      Color: '#9e5fff',
      Designation: '',
    },
    {
      Text: 'UBON-1',
      Id: 106,
      GroupId: 106,
      Color: '#6495ED',
      Designation: '',
    },
    /* ,
    {
      Text: 'T-15 (T)',
      Id: 101,
      GroupId: 101,
      Color: '#2ECC71',
      Designation: '',
    },
    {
      Text: 'T-16 (T)',
      Id: 102,
      GroupId: 102,
      Color: '#E67E22',
      Designation: '',
    },
    {
      Text: 'T-18 (T)',
      Id: 103,
      GroupId: 103,
      Color: '#FF7F50',
      Designation: '',
    },*/
  ];

  public group: GroupModel = {
    enableCompactView: false,
    resources: ['Consultants'],
  };

  public allowMultiple = false;
  public eventSettings: EventSettingsModel = {
    dataSource: this.data,
    fields: {
      subject: { title: 'Project Name', name: 'Name' },
      startTime: { title: 'Project Start Date', name: 'StartTime' },
      endTime: { title: 'Drilling End Date', name: 'EndTime' },
      description: { title: 'Description', name: 'Description' },
    },
  };

  public field: Object = {
    dataSource: watingProjectListWSOData,
    id: 'id',
    parentID: 'pid',
    text: 'Name',
    hasChildren: 'hasChild',
    selected: 'isSelected',
  };

  public allowDragAndDrop = true;

  constructor() {}

  public getConsultantName(value: ResourceDetails): string {
    return (value as ResourceDetails).resourceData[
      (value as ResourceDetails).resource.textField
    ] as string;
  }

  public getConsultantStatus(value: ResourceDetails): boolean {
    const resourceName: string = this.getConsultantName(value);
    return !(resourceName === 'GENERAL' || resourceName === 'DENTAL');
  }

  public getConsultantDesignation(value: ResourceDetails): string {
    const resourceName: string = this.getConsultantName(value);
    if (resourceName === 'GENERAL' || resourceName === 'DENTAL') {
      return '';
    } else {
      return (value as ResourceDetails).resourceData.Designation as string;
    }
  }

  public getConsultantImageName(value: ResourceDetails): string {
    return this.getConsultantName(value).toLowerCase();
  }

  public onItemDragStop(event: any): void {
    let overlapEvent = this.scheduleObj.eventBase
      .filterEvents(event.data.StartTime, event.data.EndTime)
      .filter(
        (x) =>
          x.ConsultantID == event.data.ConsultantID && x.Id != event.data.Id
      )[0]; //to find the overlapped events on dropping the event.
    let eventsToBeReschedule = this.scheduleObj
      .getEvents(event.data.StartTime)
      .filter((x) => x.ConsultantID == event.data.ConsultantID); // get the events to be reschedule due to overlap
    let overlapEventIndex = eventsToBeReschedule.findIndex(
      (x) => x.Id == overlapEvent.Id
    );
    if (overlapEventIndex != -1) {
      eventsToBeReschedule.splice(overlapEventIndex, 1);
    }
    let dropEventIndex = eventsToBeReschedule.findIndex(
      (x) => x.id == event.data.id
    );
    if (dropEventIndex != -1) {
      eventsToBeReschedule.splice(dropEventIndex, 1);
    }
    let startTime = event.data.EndTime;
    if (!isNullOrUndefined(overlapEvent)) {
      startTime = overlapEvent.EndTime;
      let timeDiff = event.data.EndTime - event.data.StartTime;
      event.data.StartTime = new Date(startTime.getTime() + 86400000);
      event.data.EndTime = new Date(event.data.StartTime.getTime() + timeDiff);
      this.scheduleObj.saveEvent(overlapEvent, 'Save');
      startTime = event.data.EndTime;

      for (let i = 0; i < eventsToBeReschedule.length; i++) {
        let timeDiff =
          eventsToBeReschedule[i].EndTime - eventsToBeReschedule[i].StartTime;
        eventsToBeReschedule[i].StartTime = new Date(
          startTime.getTime() + 86400000
        );
        eventsToBeReschedule[i].EndTime = new Date(
          eventsToBeReschedule[i].StartTime.getTime() + timeDiff
        );
        startTime = eventsToBeReschedule[i].EndTime;
      }
      this.scheduleObj.saveEvent(eventsToBeReschedule, 'Save');
    }
  }

  public onItemDrag(event: any): void {
    if (this.scheduleObj.isAdaptive) {
      const classElement: HTMLElement =
        this.scheduleObj.element.querySelector('.e-device-hover');
      if (classElement) {
        classElement.classList.remove('e-device-hover');
      }
      if (event.event.target.classList.contains('e-work-cells')) {
        addClass([event.event.target], 'e-device-hover');
      }
    }
    if (document.body.style.cursor === 'not-allowed') {
      document.body.style.cursor = '';
    }
    if (event.name === 'nodeDragging') {
      const dragElementIcon: NodeListOf<HTMLElement> =
        document.querySelectorAll(
          '.e-drag-item.treeview-external-drag .e-icon-expandable'
        );
      for (const icon of [].slice.call(dragElementIcon)) {
        icon.style.display = 'none';
      }
    }
  }

  public onActionBegin(event: ActionEventArgs): void {
    if (event.requestType === 'eventCreate' && this.isTreeItemDropped) {
      const treeViewData: Record<string, any>[] = this.treeObj.fields
        .dataSource as Record<string, any>[];
      const filteredPeople: Record<string, any>[] = treeViewData.filter(
        (item: any) => item.Id !== parseInt(this.draggedItemId, 10)
      );
      this.treeObj.fields.dataSource = filteredPeople;
      const elements: NodeListOf<HTMLElement> = document.querySelectorAll(
        '.e-drag-item.treeview-external-drag'
      );
      for (const element of [].slice.call(elements)) {
        remove(element);
      }
    }
  }

  public onTreeDragStop(event: DragAndDropEventArgs): void {
    const treeElement: Element = closest(
      event.target,
      '.e-treeview'
    ) as Element;
    const classElement: HTMLElement =
      this.scheduleObj.element.querySelector('.e-device-hover');
    if (classElement) {
      classElement.classList.remove('e-device-hover');
    }
    if (!treeElement) {
      event.cancel = true;
      const scheduleElement: Element = closest(
        event.target,
        '.e-content-wrap'
      ) as Element;
      if (scheduleElement) {
        const treeviewData: Record<string, any>[] = this.treeObj.fields
          .dataSource as Record<string, any>[];
        if (event.target.classList.contains('e-work-cells')) {
          const filteredData: Record<string, any>[] = treeviewData.filter(
            (item: any) =>
              item.id === parseInt(event.draggedNodeData.id as string, 10)
          );
          const cellData: CellClickEventArgs = this.scheduleObj.getCellDetails(
            event.target
          );
          const resourceDetails: ResourceDetails =
            this.scheduleObj.getResourcesByIndex(cellData.groupIndex);
          const eventData: Record<string, any> = {
            Name: filteredData[0].Name,
            StartTime: cellData.startTime,
            EndTime: cellData.endTime,
            IsAllDay: cellData.isAllDay,
            Description: filteredData[0].Description,
            DepartmentID: resourceDetails.resourceData.GroupId,
            ConsultantID: resourceDetails.resourceData.Id,
          };
          this.scheduleObj.openEditor(eventData, 'Add', true);
          this.isTreeItemDropped = true;
          this.draggedItemId = event.draggedNodeData.id as string;
        }
      }
    }
  }

  //Change the dataSource for TreeView
  public changeDataSource(data) {
    this.treeObj.fields = {
      dataSource: data,
      id: 'id',
      text: 'Name',
      parentID: 'pid',
      hasChildren: 'hasChild',
    };
  }

  //Filtering the TreeNodes
  public searchNodes(args) {
    let _text = this.maskObj.element.value;
    let predicats = [],
      _array = [],
      _filter = [];
    if (_text == '') {
      this.changeDataSource(watingProjectListWSOData);
    } else {
      let predicate = new Predicate('Name', 'startswith', _text, true);
      let filteredList = new DataManager(watingProjectListWSOData).executeLocal(
        new Query().where(predicate)
      );
      console.log(filteredList);
      for (let j = 0; j < filteredList.length; j++) {
        _filter.push(filteredList[j]['id']);
        let filters = this.getFilterItems(
          filteredList[j],
          watingProjectListWSOData
        );
        for (let i = 0; i < filters.length; i++) {
          if (_array.indexOf(filters[i]) == -1 && filters[i] != null) {
            _array.push(filters[i]);
            predicats.push(new Predicate('id', 'equal', filters[i], false));
          }
        }
      }
      if (predicats.length == 0) {
        this.changeDataSource([]);
      } else {
        let query = new Query().where(Predicate.or(predicats));
        let newList = new DataManager(watingProjectListWSOData).executeLocal(
          query
        );
        this.changeDataSource(newList);
        let proxy = this;
        setTimeout(function (this) {
          proxy.treeObj.expandAll();
        }, 100);
      }
    }
  }

  //Find the Parent Nodes for corresponding childs
  public getFilterItems(fList, list) {
    let nodes = [];
    nodes.push(fList['id']);
    let query2 = new Query().where('id', 'equal', fList['pid'], false);
    let fList1 = new DataManager(list).executeLocal(query2);
    if (fList1.length != 0) {
      let pNode = this.getFilterItems(fList1[0], list);
      for (let i = 0; i < pNode.length; i++) {
        if (nodes.indexOf(pNode[i]) == -1 && pNode[i] != null)
          nodes.push(pNode[i]);
      }
      return nodes;
    }
    return nodes;
  }
}
