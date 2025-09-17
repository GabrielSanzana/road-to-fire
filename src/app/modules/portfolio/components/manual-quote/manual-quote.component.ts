import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray, UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PortfolioAccount } from '../../models/portfolio-account';
import { TradeableAsset } from '../../models/tradeable-asset';
import { AccountAsset } from '../../models/account-asset';

interface AssetData {
  asset: TradeableAsset;
  formCtrl: UntypedFormControl;
  duplicates: AccountAsset[];
}

/**
 * Component to provide a UI for manually entering quotes for assets for which quotes
 * couldn't be retrieved automatically (they are not traded on exchanges or are traded on exchanges
 * that are not supported)
 */
@Component({
  selector: 'app-manual-quote',
  templateUrl: './manual-quote.component.html',
  styleUrls: ['./manual-quote.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualQuoteComponent implements OnInit {

  quotesForm: UntypedFormGroup;
  quotesFormAssets: UntypedFormArray;
  assets: AssetData[];

  constructor(public dialogRef: MatDialogRef<ManualQuoteComponent>,
    @Inject(MAT_DIALOG_DATA) public accountAssets: AccountAsset[]) {
  }

  ngOnInit() {
    this.quotesFormAssets = new UntypedFormArray([]);
    this.quotesForm = new UntypedFormGroup({
      quotesFormAssets: this.quotesFormAssets,
    });
    this.loadData();
  }

  /**
   * Create form controls for all assets passed
   */
  loadData() {
    this.assets = [];
    this.quotesFormAssets.controls.length = 0;
    const uniqueAssets = new Map<string, AccountAsset[]>();

    for (const accAsset of this.accountAssets) {
      const tradeableAsset = <TradeableAsset>accAsset.asset;
      const assetKey = tradeableAsset.getUniqueKey();
      if (!uniqueAssets.has(assetKey)) {
        uniqueAssets.set(assetKey, []);
      }
      uniqueAssets.get(assetKey).push(accAsset);
    }

    for (const [_, duplicatesGroup] of uniqueAssets) {
      const accAsset = duplicatesGroup[0];
      const tradeableAsset = <TradeableAsset>accAsset.asset;
      // Create one form control for the group, initialized to the current price of the first asset in the group
      // User will provide one quote that will be applied to all assets in the group
      // We assume that all assets in the group are of the same type and currency
      const ctrl = new UntypedFormControl(tradeableAsset.currentPrice, [Validators.min(0.00001), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]);
      this.quotesFormAssets.push(ctrl);
      this.assets.push({
        asset: tradeableAsset,
        formCtrl: ctrl,
        duplicates: duplicatesGroup,
      });
    }
  }

  /**
   * Fired when user closed the dialog. Saves user provided quotes.
   */
  saveQuotes() {
    const timestamp = new Date().toISOString();
    for (const assetData of this.assets) {
      for (const accAsset of assetData.duplicates) {
        const tradeableAsset = <TradeableAsset>accAsset.asset;
        tradeableAsset.currentPrice = +assetData.formCtrl.value;
        tradeableAsset.lastQuoteUpdate = timestamp;
      }
    }
    this.dialogRef.close(true);
  }
}
