import React, { Component } from 'react';
import classes from '../styles/Chat.module.css';
import Header from './Header';
import Logs from './Logs';
import Form from './Form';

export default class ChatBox extends Component {
	state = {
		log: [
			{
				text:
					"Hey I am Krypto! Say ' Hi ' to talk with me. I'll let you know the placement details of our college",
				variant: 'bot'
			}
		]
	};

	addMessage = (text, variant) =>
		this.setState(({ log }) => ({
			log: [ ...log, { text, variant } ]
		}));

	render() {
		const { open, toggleChatBox } = this.props;
		return (
			<div className={classes.chatBox} style={{ display: open ? 'block' : 'none' }}>
				<Header toggleChatBox={toggleChatBox} />
				<Logs messages={this.state.log} />
				<Form addMessage={this.addMessage} />
			</div>
		);
	}
}
