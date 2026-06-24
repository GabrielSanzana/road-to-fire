import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Dictionary, NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { DashboardGridTiles, DashboardGridTilesLabels, LABEL_CATEGORY_TILE_PREFIX } from '../../models/dashboard-grid-tiles';
import { PortfolioService } from '../../services/portfolio.service';


/**
 * A dialog allowing the user to select which dashboard charts should be visible
 */
@Component({
  selector: 'app-dashboard-grid-tile-editor',
  templateUrl: './dashboard-grid-tile-editor.component.html',
  styleUrls: ['./dashboard-grid-tile-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGridTileEditorComponent implements OnInit {

  gridTilesLabels = [];
  readonly DashboardGridTiles = DashboardGridTiles;
  readonly DashboardGridTileKeys = Object.keys(DashboardGridTiles);

  constructor(public dialogRef: MatDialogRef<DashboardGridTileEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public gridVisibility: Dictionary<boolean>,
    private portfolioService: PortfolioService,
    private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    // sort the tiles list alphabetically
    this.gridTilesLabels = Object.entries(DashboardGridTilesLabels).sort((a: any, b: any) => a[1].localeCompare(b[1]));
    const categories = await this.portfolioService.getLabelCategories();
    for (const category of categories) {
      this.gridTilesLabels.push([LABEL_CATEGORY_TILE_PREFIX + category.id, `Label Category: ${category.name}`]);
    }
    this.cdr.markForCheck();
  }



}
