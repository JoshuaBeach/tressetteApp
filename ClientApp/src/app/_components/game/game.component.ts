import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'app/_models/user';
import { Game } from 'app/_models/game';
import { Card } from 'app/_models/card';
import { CardAndUser } from 'app/_models/cardAndUser';
import { GameMode } from 'app/_models/enums';
import { HubService } from 'app/_services/hub.service';
import { Router } from '@angular/router';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('cardsPlayedPopover')
  private cardsPlayedPopover: NgbPopover;
  private gamefinished = false;

  private _isAlive = true;

  isGameChatSidebarOpen = false;
  gameLocked = false;
  currentUser: User;
  game: Game;
  GameMode = GameMode;

  numberUnreadMessages: number = 0;
  cardsForExtraPoints: Card[] = [];
  selectingCardsForExtraPoints: boolean = false;

  cardsDrewPreviousRound: CardAndUser[];

  constructor(private _hubService: HubService, private _router: Router) { }

  ngOnDestroy(): void {
    this._isAlive = false;
  }

  ngOnInit() {
    this._hubService.ActiveGame.pipe(takeWhile(() => this._isAlive)).subscribe(game => {
      this.game = game;
      if (game == null) return;
      if (this.gamefinished) return;
      if (this.game.cardsPlayed.length == game.players.length) {
        this.cardsDrewPreviousRound = game.cardsDrew;
        this.gameLocked = true;
        this.gamefinished = game.gameEnded;
        setTimeout(() => {
          this.game.cardsDrew = [];
          this.game.cardsPlayed = [];
          this.gameLocked = false;
          if (this.game.gameEnded) {
            let message = 'Game ended! ';
            this.game.teams.forEach(element => {
              message += ` Team ${element.name} points: ${element.calculatedPoints}`;
            });
            alert(message);
          } else if (this.game.roundEnded) {
            if (this.currentUser.name == this.game.players[0].user.name) this._hubService.StartNewRound();
          }
        }, 3500);
      }
    });

    this._hubService.CurrentUser.pipe(takeWhile(() => this._isAlive)).subscribe(user => {
      this.currentUser = user;
    });

    this._hubService.GameChatMessages.pipe(takeWhile(() => this._isAlive)).subscribe(messages => {
      if (messages.length > 0 && messages[0].username != this.currentUser.name && !this.isGameChatSidebarOpen) this.numberUnreadMessages++;
    });
  }

  makeMove(card) {
    if (this.gameLocked) return;
    if (this.selectingCardsForExtraPoints) {
      if (this.cardsForExtraPoints.includes(card)) {
        const index = this.cardsForExtraPoints.indexOf(card, 0);
        if (index > -1) {
          this.cardsForExtraPoints.splice(index, 1);
        }
      } else {
        if (this.cardsForExtraPoints.length == 4) return;
        this.cardsForExtraPoints.push(card);
      }
    } else {
      this._hubService.MakeMove(card);
    }
  }

  exitGame() {
    this._router.navigateByUrl('/');
  }

  toggleGameChatSidebar() {
    this.isGameChatSidebarOpen = !this.isGameChatSidebarOpen;
    this.numberUnreadMessages = 0;
  }

  CallAction(action: string) {
    this._hubService.CallAction(action);
  }

  showCardsPlayedPreviousRound() {
    if (this.game.cardsPlayedPreviousRound.length == this.game.players.length) {
      this.cardsPlayedPopover.toggle();
    }
  }

  addExtraPoints() {
    if (this.selectingCardsForExtraPoints) {
      this._hubService.AddExtraPoints(this.cardsForExtraPoints);
      this.cardsForExtraPoints = [];
    }
    this.selectingCardsForExtraPoints = !this.selectingCardsForExtraPoints;
  }

  getClassForCard(card: Card) {
    let classesArray = [];
    if (this.selectingCardsForExtraPoints) {
      if (this.cardsForExtraPoints.includes(card)) {
        classesArray.push('extraPointsCardSelected');
      } else {
        classesArray.push('extraPointsCardUnselected');
      }
    }
    return classesArray;
  }
}
