import { Card } from './../../_models/card';
import { Game } from './../../_models/game';
import { HubService } from './../../_services/hub.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  private _connectionId="";

  game: Game;
  cardsDrew: Card[] = new Array();

  constructor(private _hubService: HubService, private _router: Router) {}

  ngOnInit() {
    this._hubService.ActiveGame.subscribe(game => {
      this.game = game;
      if (game.cardsDrew.length == 2) {
        this.cardsDrew = game.cardsDrew;
        setTimeout(() => {
          this.cardsDrew = [];
        }, 3000);
      }
      if (game.gameEnded) {
        setTimeout(() => {
          alert(
            `You ${this.getPlayer().calculatedPoints > this.getOpponent().calculatedPoints ? 'Won' : 'Lost'}! Your points: ${
              this.getPlayer().calculatedPoints
            }, Opponent: ${this.getOpponent().calculatedPoints}`
          );
        }, 500);
      }
    });
    this._hubService.ConnectionId.subscribe(connectionId=>{
      this._connectionId=connectionId;
    })
  }

  getPlayer() {
    if (this._connectionId == this.game.player1.connectionId) {
      return this.game.player1;
    } else {
      return this.game.player2;
    }
  }
  getOpponent() {
    if (this._connectionId != this.game.player1.connectionId) {
      return this.game.player1;
    } else {
      return this.game.player2;
    }
  }

  makeMove(card) {
    this._hubService.MakeMove(card);
  }

  exitGame() {
    var cfrm = confirm('Really exit game?');
    if (cfrm) {
      this._hubService.ExitGame();
    }
  }
}
