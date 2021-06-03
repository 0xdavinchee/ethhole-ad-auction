# ethhole-ad-auction

Create an image + text area on a website and button under it which make a call to Ethereum.

Make a function allowing anyone to pay more ETH than the last person in order to change the text and image link on the website.

Lessons Learned:

- How to actually handle events on the client side => each param lines up with the event you emit from your solidity contract. This was just an exercise to see just how difficult it is to get data from the blockchain on the client. We simply are returning everything, if we didn't want to do this and we wanted to filter, it would be much harder. This is why the graph exists.
