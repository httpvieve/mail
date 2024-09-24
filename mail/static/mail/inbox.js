document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  /* submit email onclick */
  document.querySelector("#compose-form").addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});
function create_button(label, icon_name) {
  const button = document.createElement('button');
  button.className = `options`;
  button.innerHTML = `<span class="material-icons">${icon_name}</span>${label}`;
  return button;
}

function compose_email() {

  // Show compose view and hide other views
  // document.querySelector('#content-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_content (email_id, mailbox) {

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#content-view').style.display = 'block';
 
    document.querySelector('#content-view').innerHTML = `
    <ul class="list-group">
      <li class="list-group-item content-card "><h3>${email.subject}</h3> </li>
      <li class="list-group-item content-card "><b>From:</b> ${email.sender}</li>
      <li class="list-group-item content-card "><b>To:</b> ${email.recipients.join(', ')}</li>
      <li class="list-group-item content-card  "><b> Date: </b> ${email.timestamp}</li>
      <li class="list-group-item content-body">${email.body}</li>
    </ul>
    `;

    if (email.read == false) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    const unreadButton = create_button("Mark as Unread", "mark_as_unread");
    const archiveButton = create_button(email.archived ? "Unarchive" : "Archive", email.archived ? "unarchive" : "archive");

    archiveButton.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(() => load_mailbox('inbox'))
    });

    unreadButton.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: false
        })
      })
      .then(() => load_mailbox('inbox'))
    });

    if (mailbox !== 'sent') { document.querySelector("#content-view").append(archiveButton, unreadButton); }
    
    const replyButton = create_button("Reply", "reply");
    const forwardButton = create_button("Forward", "forward");

    forwardButton.addEventListener ('click', function() {
      compose_email();
      document.querySelector('#compose-recipients').value = '';
      document.querySelector('#compose-subject').value = email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`;
      document.querySelector('#compose-body').value = `---------- Forwarded message ---------\nFrom: ${email.sender}\nDate: ${email.timestamp}\nSubject: ${email.subject}\nTo: ${email.recipients.join(', ')}\n\n${email.body}`;
      });

    replyButton.addEventListener ('click', function() {
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n\t ${email.body} \n`;
    });
    
      document.querySelector("#content-view").append(replyButton, forwardButton);
    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views                          
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails.length > 0) {
      /* loop through all existing mails*/
      
      emails.forEach (mail => {
        const mailContent = document.createElement('div');
        mailContent.className = `email-card ${mail.read ? "mail-viewed" : "mail-pending"}`;
        if (mailbox != 'sent') {
        mailContent.innerHTML = `
        <p class="email-sender"> ${mail.sender}</p>
        <p class="email-details">${mail.subject} - <span class="email-body">${mail.body}<span></p>
        <p class="email-timestamp"> ${mail.timestamp}</p>
        `;
      } else {
        mailContent.innerHTML = `
        <p class="email-sender">To:${mail.recipients}</p>
        <p class="email-details">${mail.subject} - <span class="email-body">${mail.body}<span></p>
        <p class="email-timestamp"> ${mail.timestamp}</p>
        `;
      }
        mailContent.addEventListener ('click', function() {
          view_content(mail.id, mailbox)
        });
        document.querySelector("#emails-view").append(mailContent);
      });
    } else {
      document.querySelector("#emails-view").append('No emails yet.');
    }
  });
}
function send_email(event) {
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(() => load_mailbox('sent'));
}


