variable "bucket_name" {
    type = "string"
}

variable "project" {
    type = "string"
}

provider "google" {
    project = var.project
}

resource "google_pubsub_topic" "node-red-topic" {
    name = "node-red-topic"
}

resource "google_pubsub_subscription" "node-red-subscription" {
    name ="node-red-subscription"
    topic = "${google_pubsub_topic.node-red-topic.name}"
}

// Used by GCS read tests.
resource "google_storage_bucket" "storage-bucket" {
    name = var.bucket_name
}

// Used by GCS read tests.
resource "google_storage_bucket_object" "text-file" {
    name = "text1.txt"
    content = "Some text to save"   // Content must match what is expected in tests.
    content_type = "text/plain"
    bucket = var.bucket_name
}