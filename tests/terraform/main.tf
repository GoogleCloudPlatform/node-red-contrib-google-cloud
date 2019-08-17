provider "google" {
    project = "kolban-test"
}

resource "google_pubsub_topic" "node-red-topic" {
    name = "node-red-topic"
}

resource "google_pubsub_subscription" "node-red-subscription" {
    name ="node-red-subscription"
    topic = "${google_pubsub_topic.node-red-topic.name}"
}