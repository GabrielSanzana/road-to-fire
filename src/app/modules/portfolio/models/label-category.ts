export interface LabelCategoryData {
    id?: number;
    name: string;
    description?: string;
}

export class LabelCategory implements LabelCategoryData {
    id?: number;
    name: string;
    description?: string;

    constructor(source?: LabelCategoryData) {
        if (source) {
            Object.assign(this, source);
        }
    }
}
