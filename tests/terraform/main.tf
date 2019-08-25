variable "bucket_name" {
    type = string
}

variable "project" {
    type = string
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

resource "google_storage_bucket" "storage-bucket" {
    name = var.bucket_name
}

resource "google_storage_bucket_object" "wav-file" {
    name = "OSR_us_000_0030_8k.wav"
    source = "tmp/OSR_us_000_0030_8k.wav"
    bucket = var.bucket_name
}