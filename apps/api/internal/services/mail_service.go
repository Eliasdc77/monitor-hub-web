package services

import (
	"fmt"
	"net/smtp"
	"strings"
)

type MailSender interface {
	Send(to, subject, body string) error
}

type SMTPMailSender struct {
	host     string
	port     string
	username string
	password string
	from     string
}

func NewSMTPMailSender(host, port, username, password, from string) (MailSender, error) {
	host = strings.TrimSpace(host)
	port = strings.TrimSpace(port)
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)
	from = strings.TrimSpace(from)

	if host == "" || port == "" || username == "" || password == "" || from == "" {
		return nil, nil
	}

	return &SMTPMailSender{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     from,
	}, nil
}

func (s *SMTPMailSender) Send(to, subject, body string) error {
	to = strings.TrimSpace(to)
	if to == "" {
		return nil
	}

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	headers := []string{
		fmt.Sprintf("From: %s", s.from),
		fmt.Sprintf("To: %s", to),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"UTF-8\"",
	}
	msg := strings.Join(headers, "\r\n") + "\r\n\r\n" + body
	return smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
}
