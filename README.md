# Sport2Meet
## Table des matières
* [Setup de notre API](#setup-de-notre-api)
* [Description du projet](#description-du-projet)
* [Questions générales](#questions-générales)
* [Questions spécifiques](#questions-spécifiques)



## Setup de notre API

## Description du projet
Sport2Meet est une application qui permet de se rencontrer pour faire du sport. Une personne peut créer des activitiés sportives dont il·elle choisit l’emplacement, la date et l’heure. D’autres personnes peuvent ensuite s’inscrire à cette activité.

Sur l’application, il sera possible de mettre des photos de chaque séance, pour partager les moments passés ensemble. Il y aura également un chat afin de discuter avec d’autres participant·e·s.

Une carte sera également disponible pour voir les activités sportives qui sont près de la personne, selon sa géolocalisation.

Ce repo Github ne comprend que l’API de l’application Sport2Meet.


## Questions générales
<b>Que construisons-nous, en une phrase ?</b><br>
* Sport2Meet est une application qui permet de se rencontrer pour faire du sport.

<b>Pourquoi le construisons-nous ?</b><br>
* Nous voulons favoriser la pratique de sport collectif.

<b>Qui l'utilisera ?</b><br>
* Les jeunes en ville ou en campagne qui souhaitent faire du sport avec d’autres personnes. Soit parce qu’ils·elles ne sont pas assez dans leur groupe d’amis pour le sport choisi. Soit parce qu’une personne seule veut faire un sport en groupe et rencontrer d’autres personnes.


## Questions spécifiques
<b>Comment allons-nous le construire ?</b><br>
* Une REST API en JavaScript avec [Node.js](https://nodejs.org/en/)
* Une base de données [MongoDB](https://www.mongodb.com/)
* [Render](https://render.com/) pour héberger notre API en ligne
* Des interactions en temps réels avec [WebSockets](https://msg-central.herokuapp.com/)

<b>Comment notre équipe va-t-elle fonctionner ? Y a-t-il des rôles spécifiques ?</b><br>
* Nous allons nous répartir les différentes tâches du projet, chacun fera sa part. Il n’y a pas de rôle spécifique.

<b>Quelles sont nos différentes ressources ?</b><br>
* Utilisateur
* Activité
* Messagerie
* Photo

<b>Quels endpoints allons-nous utiliser ?</b><br>
* Tous les endpoints sont listés dans la [documentation](https://sport-2-meet.onrender.com/) du projet.

## Serveur websocket
### Connection au serveur depuis Postman
Pour se connecter au serveur depuis postman, il faut ouvrir une page "WebSocket Request".
Ensuite, l'adresse du serveur est ws://sport-2-meet.onrender.com/ et ajouter le token dans le header :
Key : Authorization
Value : Bearer gbrthhbrtGEHFeruierojbgeéprg
Ne pas oublier de se connecter avec un user dans une autre page afin de pouvoir mettre le token lors de la connection au serveur websocket.
