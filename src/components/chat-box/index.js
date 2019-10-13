import React, { useState, useEffect } from 'react';
import useToggleState from '../../hooks/useToggleState';
import useLogState from '../../hooks/useLogState';
import $ from 'jquery';
import Speech from 'speak-tts';
import Header from './Header';
import Log from './log';
import Suggestions from './suggestions';
import Form from './Form';
import dialogflow from '../../config/dialogflow';
import speechConfig from '../../config/speechOutput';
import random from '../../helpers/randomFromArray';
import errorMessages from '../../helpers/messages/error';
import { chatBox } from '../../styles/ChatBox.module.css';

export default function ChatBox({ open, toggleChatBox }) {
	const speech = new Speech(),
		speechRecognition = new window.webkitSpeechRecognition();

	speech
		.init(speechConfig)
		.catch((error) =>
			console.error('An error occured while initializing Speech : ', error)
		);
	speechRecognition.onresult = (event) => {
		let text = '';
		for (let i = event.resultIndex; i < event.results.length; ++i)
			text += event.results[i][0].transcript;
		fetchBotResponse(text);
		addMessage('text', text, 'user');
		toggleSpeechInput();
	};

	const [ log, addLog ] = useLogState();
	const [ suggestions, setSuggestions ] = useState([]);
	const [ speechInput, toggleSpeechInput ] = useToggleState();
	const [ typing, toggleTyping ] = useToggleState();
	const [ speechOutput, toggleSpeechOutput ] = useToggleState(true);

	useEffect(speech.cancel, [ speechOutput ]);
	useEffect(
		() => (speechInput ? speechRecognition.start() : speechRecognition.stop()),
		[ speechInput ]
	);

	const addMessage = (type, payload, user) => {
		if (user === 'bot') {
			toggleTyping();
			if (speechOutput && type !== 'image') speech.speak({ text: payload });
		}
		addLog(type, payload, user);
	};

	const onUserResponse = (res) => {
		fetchBotResponse(res);
		addMessage('text', res, 'user');
		toggleTyping();
	};

	const fetchBotResponse = (userResponse) => {
		const { url, accessToken, sessionId } = dialogflow;
		$.post({
			url,
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			headers: {
				Authorization: `Bearer ${accessToken}`
			},
			data: JSON.stringify({
				query: userResponse,
				lang: 'en',
				sessionId
			})
		})
			.then((res) => parseBotResponse(res.result.fulfillment.speech))
			.catch(() => addMessage('text', random(errorMessages), 'bot'));
	};

	const parseBotResponse = (res) => {
		if (res.includes('<ar>')) parseSuggestions(res);
		else if (res.includes('<br>')) parseTextResponse(res);
		else if (res.includes('<img>')) parseImageResponse(res);
		else addMessage('text', res, 'bot');
	};

	const parseSuggestions = (res) => {
		parseTextResponse(res.split(/<ar>/)[0]);
		setSuggestions(res.split(/<ar>/).splice(1));
	};

	const parseTextResponse = (res) => {
		if (res.includes('<img>')) parseImageResponse(res.split(/<br>/)[0]);
		const messages = res.split(/<br>/).splice(1);
		for (var message of messages) addMessage('text', message, 'bot');
	};

	const parseImageResponse = (res) => addMessage('image', res.split(/<img>/)[1], 'bot');

	return (
		<div className={chatBox} style={{ display: open ? 'block' : 'none' }}>
			<Header
				toggleChatBox={toggleChatBox}
				speechOutput={speechOutput}
				toggleSpeechOutput={toggleSpeechOutput}
			/>
			<Log log={log} typingIndicator={typing} />
			<Suggestions suggestions={suggestions} handleSubmit={onUserResponse} />
			<Form
				speechInput={speechInput}
				toggleSpeechInput={toggleSpeechInput}
				handleSubmit={onUserResponse}
			/>
		</div>
	);
}
