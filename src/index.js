
import {
    GetQueueUrlCommand,
    SendMessageCommand,
    ReceiveMessageCommand,
    PurgeQueueCommand,
  } from "@aws-sdk/client-sqs";
  import { sqsClient } from "./libs/sqsClient.js";
  
  const QueueName = "Message.fifo"; // The Amazon SQS queue name, which must end in .fifo for this example.
  

// Populate the chat

  $(function () {
    populateChat();
  });
  
  const populateChat = async () => {
    try {
      // Set the Amazon SQS Queue parameters.
      const queueParams = {
        QueueName: QueueName,
        Attributes: {
          DelaySeconds: "60",
          MessageRetentionPeriod: "86400",
        },
      };
      // Get the Amazon SQS Queue URL.
      const data = await sqsClient.send(new GetQueueUrlCommand(queueParams));
      console.log("Success. The URL of the SQS Queue is: ", data.QueueUrl);
      // Set the parameters for retrieving the messages in the Amazon SQS Queue.
      var getMessageParams = {
        QueueUrl: data.QueueUrl,
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ["All"],
        VisibilityTimeout: 20,
        WaitTimeSeconds: 20,
      };
      try {
        // Retrieve the messages from the Amazon SQS Queue.
        const data = await sqsClient.send(
          new ReceiveMessageCommand(getMessageParams)
        );
        console.log("Successfully retrieved messages", data.Messages);
  
        // Loop through messages for user and message body.
        var i;
        for (i = 0; i < data.Messages.length; i++) {
          const name = data.Messages[i].MessageAttributes.Name.StringValue;
          const body = data.Messages[i].Body;
          // Create the HTML for the message.
          var userText = body + "<br><br><b>" + name;
          var myTextNode = $("#base").clone();
          myTextNode.text(userText);
          var image_url;
          var n = name.localeCompare("Scott");
          if (n == 0) image_url = "./images/av1.png";
          else image_url = "./images/av2.png";
          var images_div =
            '<img src="' +
            image_url +
            '" alt="Avatar" class="right" style=""width:100%;"">';
          myTextNode.html(userText);
          myTextNode.append(images_div);
  
          // Add the message to the GUI.
          $("#messages").append(myTextNode);
        }
      } catch (err) {
        console.log("Error loading messages: ", err);
      }
    } catch (err) {
      console.log("Error retrieving SQS queue URL: ", err);
    }
  };


// Push the messages

const pushMessage = async () => {
  // Get and convert user and message input.
  var user = $("#username").val();
  var message = $("#textarea").val();

  // Create random deduplication ID.
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
    c
  ) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

  try {
    // Set the Amazon SQS Queue parameters.
    const queueParams = {
      QueueName: QueueName,
      Attributes: {
        DelaySeconds: "60",
        MessageRetentionPeriod: "86400",
      },
    };
    const data = await sqsClient.send(new GetQueueUrlCommand(queueParams));
    console.log("Success. The URL of the SQS Queue is: ", data.QueueUrl);
    // Set the parameters for the message.
    var messageParams = {
      MessageAttributes: {
        Name: {
          DataType: "String",
          StringValue: user,
        },
      },
      MessageBody: message,
      MessageDeduplicationId: uuid,
      MessageGroupId: "GroupA",
      QueueUrl: data.QueueUrl,
    };
    const result = await sqsClient.send(new SendMessageCommand(messageParams));
    console.log("Success", result.MessageId);

    // Set the parameters for retrieving all messages in the SQS queue.
    var getMessageParams = {
      QueueUrl: data.QueueUrl,
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ["All"],
      VisibilityTimeout: 20,
      WaitTimeSeconds: 20,
    };

    // Retrieve messages from SQS Queue.
    const final = await sqsClient.send(
      new ReceiveMessageCommand(getMessageParams)
    );
    console.log("Successfully retrieved", final.Messages);
    $("#messages").empty();
    // Loop through messages for user and message body.
    var i;
    for (i = 0; i < final.Messages.length; i++) {
      const name = final.Messages[i].MessageAttributes.Name.StringValue;
      const body = final.Messages[i].Body;
      // Create the HTML for the message.
      var userText = body + "<br><br><b>" + name;
      var myTextNode = $("#base").clone();
      myTextNode.text(userText);
      var image_url;
      var n = name.localeCompare("Scott");
      if (n == 0) image_url = "./images/av1.png";
      else image_url = "./images/av2.png";
      var images_div =
        '<img src="' +
        image_url +
        '" alt="Avatar" class="right" style=""width:100%;"">';
      myTextNode.html(userText);
      myTextNode.append(images_div);
      // Add the HTML to the GUI.
      $("#messages").append(myTextNode);
    }
  } catch (err) {
    console.log("Error", err);
  }
};
// Make the function available to the browser window.
window.pushMessage = pushMessage;

// Remove the messages

// Delete the message from the Amazon SQS queue.
const purge = async () => {
  try {
    // Set the Amazon SQS Queue parameters.
    const queueParams = {
      QueueName: QueueName,
      Attributes: {
        DelaySeconds: "60",
        MessageRetentionPeriod: "86400",
      },
    };
    // Get the Amazon SQS Queue URL.
    const data = await sqsClient.send(new GetQueueUrlCommand(queueParams));
    console.log("Success", data.QueueUrl);
    // Delete all the messages in the Amazon SQS Queue.
    const result = await sqsClient.send(
      new PurgeQueueCommand({ QueueUrl: data.QueueUrl })
    );
    // Delete all the messages from the GUI.
    $("#messages").empty();
    console.log("Success. All messages deleted.", data);
  } catch (err) {
    console.log("Error", err);
  }
};

// Make the function available to the browser window.
window.purge = purge;

