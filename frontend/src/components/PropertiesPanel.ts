import { BaseNode } from '../nodes/BaseNode';

import { commandHistory } from '../commands/CommandHistory';
import { UpdateNodePropertiesCommand } from '../commands/UpdateNodePropertiesCommand';

export type OnUpdateCallback = (node: BaseNode) => void;

export class PropertiesPanel {
  private panelElement: HTMLElement;
  private currentNode: BaseNode | null = null;
  private onUpdate: OnUpdateCallback;
  private originalProperties: any = null;

  constructor(container: HTMLElement, onUpdate: OnUpdateCallback) {
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'wao-properties-panel';
    this.applyStyles();
    container.appendChild(this.panelElement);
    this.onUpdate = onUpdate;
    this.hide();
  }

  public show(node: BaseNode): void {
    this.currentNode = node;
    this.originalProperties = JSON.parse(JSON.stringify(node.properties)); // Deep clone for undo
    this.render();
    this.panelElement.style.display = 'block';
  }

  public hide(): void {
    this.panelElement.style.display = 'none';
    this.currentNode = null;
  }

  private render(): void {
    if (!this.currentNode) return;
    const node = this.currentNode;
    this.panelElement.innerHTML = ''; // Clear previous content

    const title = document.createElement('h3');
    title.textContent = `${node.type} Properties`;
    this.panelElement.appendChild(title);

    // Generic properties for all nodes
    this.createTextField(this.panelElement, 'Title', node.title, (newValue) => {
      node.title = newValue;
      this.onUpdate(node);
    });

    this.createTextField(this.panelElement, 'Node ID', node.id, () => {}, true);

    // Dynamic properties based on node.properties
    this.createDynamicFields(this.panelElement, node.properties, (newProps) => {
        const command = new UpdateNodePropertiesCommand(node.id, this.originalProperties, newProps);
        commandHistory.execute(command);
        this.originalProperties = JSON.parse(JSON.stringify(newProps)); // Update original for next change
        this.render(); // Re-render panel for dependent fields
    });
  }

  private createTextField(
    parent: HTMLElement, 
    label: string, 
    value: string, 
    onChange: (newValue: string) => void,
    disabled: boolean = false
  ): void {
    const fieldId = `prop-${label.replace(/\s+/g, '-')}`;
    const fieldWrapper = document.createElement('div');
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = label;
    fieldLabel.htmlFor = fieldId;
    
    const fieldInput = document.createElement('input');
    fieldInput.type = 'text';
    fieldInput.id = fieldId;
    fieldInput.value = value;
    fieldInput.disabled = disabled;
    fieldInput.onchange = (e) => onChange((e.target as HTMLInputElement).value);
    
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(fieldInput);
    parent.appendChild(fieldWrapper);
  }
  
  private createDropdownField(
    parent: HTMLElement, 
    label: string, 
    value: string, 
    options: string[], 
    onChange: (newValue: string) => void
  ): void {
    const fieldId = `prop-${label.replace(/\s+/g, '-')}`;
    const fieldWrapper = document.createElement('div');
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = label;
    fieldLabel.htmlFor = fieldId;

    const fieldSelect = document.createElement('select');
    fieldSelect.id = fieldId;
    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        if (optionValue === value) {
            option.selected = true;
        }
        fieldSelect.appendChild(option);
    });
    fieldSelect.onchange = (e) => onChange((e.target as HTMLSelectElement).value);
    
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(fieldSelect);
    parent.appendChild(fieldWrapper);
  }

  private createTextareaField(
    parent: HTMLElement, 
    label: string, 
    value: string, 
    onChange: (newValue: string) => void
  ): void {
    const fieldId = `prop-${label.replace(/\s+/g, '-')}`;
    const fieldWrapper = document.createElement('div');
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = label;
    fieldLabel.htmlFor = fieldId;
    
    const fieldTextarea = document.createElement('textarea');
    fieldTextarea.id = fieldId;
    fieldTextarea.value = value;
    fieldTextarea.rows = 3;
    fieldTextarea.onchange = (e) => onChange((e.target as HTMLTextAreaElement).value);

    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(fieldTextarea);
    parent.appendChild(fieldWrapper);
  }

  private createDynamicFields(parent: HTMLElement, props: any, onChange: (newProps: any) => void): void {
    for (const key in props) {
      const value = props[key];
      if (typeof value === 'object' && value !== null) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = key;
        fieldset.appendChild(legend);
        this.createDynamicFields(fieldset, value, (newValue) => {
            const updatedProps = { ...props, [key]: newValue };
            onChange(updatedProps);
        });
        parent.appendChild(fieldset);
      } else if (typeof value === 'string') {
        this.createTextField(parent, key, value, (newValue) => {
            const updatedProps = { ...props, [key]: newValue };
            onChange(updatedProps);
        });
      } else if (typeof value === 'boolean') {
        // Example for boolean, can be expanded
      }
    }
  }

  private applyStyles(): void {
    this.panelElement.style.position = 'fixed';
    this.panelElement.style.top = '20px';
    this.panelElement.style.right = '20px';
    this.panelElement.style.width = '300px';
    this.panelElement.style.padding = '15px';
    this.panelElement.style.background = '#f9f9f9';
    this.panelElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    this.panelElement.style.borderRadius = '8px';
    this.panelElement.style.zIndex = '1000';
    this.panelElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.panelElement.style.maxHeight = '90vh';
    this.panelElement.style.overflowY = 'auto';
    
    const style = document.createElement('style');
    style.textContent = `
        #wao-properties-panel h3 {
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 18px;
            color: #111;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        #wao-properties-panel div {
            margin-bottom: 12px;
        }
        #wao-properties-panel label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
            font-weight: 500;
        }
        #wao-properties-panel input,
        #wao-properties-panel select,
        #wao-properties-panel textarea {
            display: block;
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }
        #wao-properties-panel input:disabled {
            background: #eee;
        }
        #wao-properties-panel textarea {
            resize: vertical;
        }
        #wao-properties-panel fieldset {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-top: 15px;
        }
        #wao-properties-panel legend {
            padding: 0 5px;
            font-weight: 500;
            color: #333;
        }
    `;
    document.head.appendChild(style);
  }
}
