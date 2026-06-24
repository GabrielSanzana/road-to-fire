import { LabelCategory } from './label-category';

export interface LabelData {
    id?: number;
    category: LabelCategory;
    name: string;
    color?: string; // Optional hex color code for UI
}

export class Label implements LabelData {
    id?: number;
    category: LabelCategory;
    name: string;
    color?: string;

    constructor(source?: LabelData) {
        if (source) {
            Object.assign(this, source);
        }
    }
}
