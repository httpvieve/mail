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

function compose_email() {

  // Show compose view and hide other views
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
      <div class="content-metadata-container">
      <p class="header-subject"> ${email.subject} </p>
          <ul class="content-details">
        <li><b>From:</b> ${email.sender}</li>
        <li><b>To:</b> ${email.recipients.join(', ')}</li>
        <li><b> Date: </b> ${email.timestamp}</li>
        </ul>
        </div>
          <p class="content-body"> ${email.body}</p>
      `;
    /* update if email viewed */
    if (email.read == false) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    /* archive on click */

    if (mailbox !== 'sent') {

      const archiveButton = document.createElement('button');
      archiveButton.innerHTML = email.archived ? "Remove from Archive" : "Archive Email";
      archiveButton.className = email.archived ? "unarchive-button" : "archive-button";
      
      archiveButton.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(() => { load_mailbox('inbox')})
    });
    
    document.querySelector("#content-view").append(archiveButton);
    
  }

    /* reply on click */
    const replyButton = document.createElement('button');
    replyButton.innerHTML = "Reply";
    replyButton.className = "reply-button";
    replyButton.addEventListener ('click', function() {

      // document.querySelector('#content-view').style.display = 'none';
      compose_email();
      document.querySelector('#compose-recipients').value = email.recipients.join(', ');
      document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} <${email.sender}> wrote: \n\t ${email.body} \n`;

      });
      document.querySelector("#content-view").append(replyButton);
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

    /* loop through all existing mails*/
    emails.forEach (mail => {
      const mailContent = document.createElement('div');
      mailContent.className = `email-card ${mail.read ? "mail-viewed" : "mail-pending"}`;
      mailContent.innerHTML = `
        <p class="email-sender">${mail.sender}</p>
        <p class="email-details">${mail.subject} - <span class="email-body">${mail.body}<span></p>
        <p class="email-timestamp"> ${mail.timestamp}</p>
        `;
      mailContent.addEventListener ('click', function() {
        view_content(mail.id, mailbox)
      });
      document.querySelector("#emails-view").append(mailContent);
      
    });
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
  .then(response => load_mailbox('sent'));
}


